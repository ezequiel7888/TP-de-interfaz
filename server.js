import sql from 'mssql/msnodesqlv8.js'
import { createHmac, randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const databaseName = 'VotoIntendente'
const dataDirectory = join(root, 'data')
const dniKeyPath = join(dataDirectory, 'dni-hmac-key')
mkdirSync(dataDirectory, { recursive: true })

function loadDniKey() {
  try {
    const savedKey = readFileSync(dniKeyPath)
    if (savedKey.length !== 32) throw new Error('El archivo de protección de DNI no es válido.')
    return savedKey
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    const newKey = randomBytes(32)
    try {
      writeFileSync(dniKeyPath, newKey, { flag: 'wx', mode: 0o600 })
      return newKey
    } catch (writeError) {
      if (writeError.code !== 'EEXIST') throw writeError
      return readFileSync(dniKeyPath)
    }
  }
}

const dniKey = loadDniKey()
const dniFingerprint = (dni) => createHmac('sha256', dniKey).update(dni).digest()
const baseConfig = {
  server: '(localdb)\\MSSQLLocalDB',
  database: 'master',
  options: {
    trustedConnection: true,
    encrypt: false,
    trustServerCertificate: true,
  },
  // SQL Server Native Client 11 no viene instalado con versiones actuales de SQL Server.
  beforeConnect(connection) {
    connection.conn_str = connection.conn_str.replace(
      'SQL Server Native Client 11.0',
      'ODBC Driver 17 for SQL Server',
    )
  },
  connectionTimeout: 10000,
  requestTimeout: 10000,
}

async function connectDatabase() {
  const master = await new sql.ConnectionPool(baseConfig).connect()
  try {
    await master.request().query(`IF DB_ID(N'${databaseName}') IS NULL CREATE DATABASE [${databaseName}]`)
  } finally {
    await master.close()
  }

  const pool = await new sql.ConnectionPool({ ...baseConfig, database: databaseName }).connect()
  await pool.request().query(`
    IF OBJECT_ID(N'dbo.ElectionState', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.ElectionState (
        StateId INT NOT NULL PRIMARY KEY CHECK (StateId = 1),
        StateJson NVARCHAR(MAX) NOT NULL,
        UpdatedAt DATETIME2 NOT NULL
      )
    END;
    IF OBJECT_ID(N'dbo.Votos', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.Votos (
        OpcionId NVARCHAR(60) NOT NULL PRIMARY KEY,
        Cantidad INT NOT NULL CHECK (Cantidad >= 0)
      )
    END;
    IF OBJECT_ID(N'dbo.VotantesRegistrados', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.VotantesRegistrados (
        DniHuella VARBINARY(32) NOT NULL PRIMARY KEY,
        FechaRegistro DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
      )
    END;
  `)
  return pool
}

function sendJson(response, status, value) {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' })
  response.end(JSON.stringify(value))
}

async function loadState(pool) {
  const [stateResult, votesResult] = await Promise.all([
    pool.request().query('SELECT StateJson FROM dbo.ElectionState WHERE StateId = 1'),
    pool.request().query('SELECT OpcionId, Cantidad FROM dbo.Votos'),
  ])
  const row = stateResult.recordset[0]
  if (!row) return null
  const state = JSON.parse(row.StateJson)
  state.votes = Object.fromEntries(votesResult.recordset.map((vote) => [vote.OpcionId, vote.Cantidad]))
  return state
}

async function readJsonBody(request, response) {
  let raw = ''
  for await (const chunk of request) {
    raw += chunk
    if (raw.length > 2_000_000) {
      sendJson(response, 413, { error: 'El estado supera el tamaño permitido.' })
      return null
    }
  }
  try {
    return JSON.parse(raw)
  } catch {
    sendJson(response, 400, { error: 'El contenido de la solicitud no es válido.' })
    return null
  }
}

async function saveState(pool, state, { registerDniHash, releaseDniHash, clearVoters = false } = {}) {
  const votes = Object.entries(state.votes)
  if (votes.some(([id, count]) => !id || id.length > 60 || !Number.isInteger(count) || count < 0)) {
    throw new Error('Los totales de votos no son válidos.')
  }

  // El comprobante de sesión no se comparte entre votantes ni queda asociado a la base.
  delete state.myVote
  const stateToSave = { ...state }
  delete stateToSave.votes

  const transaction = new sql.Transaction(pool)
  await transaction.begin()
  try {
    if (registerDniHash) {
      const existingRequest = new sql.Request(transaction)
      existingRequest.input('dniHash', sql.VarBinary(32), registerDniHash)
      const existing = await existingRequest.query(`
        SELECT TOP (1) 1 AS YaRegistro FROM dbo.VotantesRegistrados WITH (UPDLOCK, HOLDLOCK)
        WHERE DniHuella = @dniHash
      `)
      if (existing.recordset.length) {
        const duplicate = new Error('Este DNI ya registró un voto. No se guardó otro voto.')
        duplicate.code = 'DUPLICATE_DNI'
        throw duplicate
      }
      const registerRequest = new sql.Request(transaction)
      registerRequest.input('dniHash', sql.VarBinary(32), registerDniHash)
      await registerRequest.query('INSERT INTO dbo.VotantesRegistrados (DniHuella) VALUES (@dniHash)')
    }

    if (releaseDniHash) {
      const releaseRequest = new sql.Request(transaction)
      releaseRequest.input('dniHash', sql.VarBinary(32), releaseDniHash)
      await releaseRequest.query('DELETE FROM dbo.VotantesRegistrados WHERE DniHuella = @dniHash')
    } else if (clearVoters) {
      await new sql.Request(transaction).query('DELETE FROM dbo.VotantesRegistrados')
    }

    const stateRequest = new sql.Request(transaction)
    stateRequest.input('stateJson', sql.NVarChar(sql.MAX), JSON.stringify(stateToSave))
    await stateRequest.query(`
      IF EXISTS (SELECT 1 FROM dbo.ElectionState WHERE StateId = 1)
        UPDATE dbo.ElectionState
        SET StateJson = @stateJson, UpdatedAt = SYSUTCDATETIME()
        WHERE StateId = 1
      ELSE
        INSERT INTO dbo.ElectionState (StateId, StateJson, UpdatedAt)
        VALUES (1, @stateJson, SYSUTCDATETIME());
    `)

    await new sql.Request(transaction).query('DELETE FROM dbo.Votos')
    for (const [optionId, count] of votes) {
      const voteRequest = new sql.Request(transaction)
      voteRequest.input('optionId', sql.NVarChar(60), optionId)
      voteRequest.input('count', sql.Int, count)
      await voteRequest.query('INSERT INTO dbo.Votos (OpcionId, Cantidad) VALUES (@optionId, @count)')
    }
    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' }
const apiOnly = process.argv.includes('--api-only')
const port = Number(process.env.PORT || (apiOnly ? 3001 : 4173))

try {
  const pool = await connectDatabase()
  createServer(async (request, response) => {
    if (request.url === '/api/state' && request.method === 'GET') {
      try {
        return sendJson(response, 200, await loadState(pool))
      } catch {
        return sendJson(response, 500, { error: 'No se pudo leer la base VotoIntendente.' })
      }
    }

    if (request.url === '/api/state' && request.method === 'PUT') {
      try {
        const state = await readJsonBody(request, response)
        if (!state) return
        if (!state || typeof state !== 'object' || !state.votes || !Array.isArray(state.mesas)) {
          return sendJson(response, 400, { error: 'El estado de la elección no es válido.' })
        }
        await saveState(pool, state)
        return sendJson(response, 200, { ok: true })
      } catch (error) {
        console.error('Error guardando la votación:', error.message)
        return sendJson(response, 500, { error: error.message || 'No se pudo guardar la votación en SQL Server.' })
      }
    }

    if (request.url === '/api/check-dni' && request.method === 'POST') {
      try {
        const body = await readJsonBody(request, response)
        if (!body) return
        const dni = String(body.dni || '').replace(/\D/g, '')
        if (dni.length < 7 || dni.length > 8) {
          return sendJson(response, 400, { error: 'Ingresá un DNI válido: 7 u 8 números.' })
        }
        const checkRequest = pool.request()
        checkRequest.input('dniHash', sql.VarBinary(32), dniFingerprint(dni))
        const result = await checkRequest.query(`
          SELECT TOP (1) 1 AS YaRegistro
          FROM dbo.VotantesRegistrados
          WHERE DniHuella = @dniHash
        `)
        return sendJson(response, 200, { registered: result.recordset.length > 0 })
      } catch (error) {
        console.error('Error verificando el DNI:', error.message)
        return sendJson(response, 500, { error: 'No se pudo verificar el DNI en SQL Server.' })
      }
    }

    if (request.url === '/api/vote' && request.method === 'POST') {
      try {
        const body = await readJsonBody(request, response)
        if (!body) return
        const dni = String(body.dni || '').replace(/\D/g, '')
        const state = body.state
        if (dni.length < 7 || dni.length > 8 || !state?.myVote || state.myVote.dni !== dni ||
            !state.votes || !Array.isArray(state.mesas)) {
          return sendJson(response, 400, { error: 'El DNI o el voto no son válidos.' })
        }
        await saveState(pool, state, { registerDniHash: dniFingerprint(dni) })
        return sendJson(response, 200, { ok: true })
      } catch (error) {
        if (error.code === 'DUPLICATE_DNI') return sendJson(response, 409, { error: error.message })
        console.error('Error registrando el voto:', error.message)
        return sendJson(response, 500, { error: error.message || 'No se pudo guardar la votación.' })
      }
    }

    if ((request.url === '/api/undo' || request.url === '/api/reset') && request.method === 'POST') {
      try {
        const body = await readJsonBody(request, response)
        if (!body) return
        const state = body.state
        if (!state?.votes || !Array.isArray(state.mesas)) {
          return sendJson(response, 400, { error: 'El estado de la elección no es válido.' })
        }
        if (request.url === '/api/reset') {
          await saveState(pool, state, { clearVoters: true })
        } else {
          const dni = String(body.dni || '').replace(/\D/g, '')
          if (dni.length < 7 || dni.length > 8) return sendJson(response, 400, { error: 'El DNI no es válido.' })
          await saveState(pool, state, { releaseDniHash: dniFingerprint(dni) })
        }
        return sendJson(response, 200, { ok: true })
      } catch (error) {
        console.error('Error actualizando la votación:', error.message)
        return sendJson(response, 500, { error: error.message || 'No se pudo actualizar la votación.' })
      }
    }

    if (apiOnly) return sendJson(response, 404, { error: 'Ruta inexistente.' })
    const dist = join(root, 'dist')
    let requested = '/'
    try {
      requested = decodeURIComponent((request.url || '/').split('?')[0])
    } catch {
      return sendJson(response, 400, { error: 'La ruta no es válida.' })
    }
    const candidatePath = resolve(dist, `.${requested}`)
    const safePath = candidatePath === dist || candidatePath.startsWith(dist + sep)
    const filePath = safePath && existsSync(candidatePath) ? candidatePath : join(dist, 'index.html')
    try {
      response.writeHead(200, { 'Content-Type': mime[extname(filePath)] || 'application/octet-stream' })
      response.end(readFileSync(filePath))
    } catch {
      response.writeHead(404)
      response.end('Primero compilá la aplicación con npm run build.')
    }
  }).listen(port, '127.0.0.1', () => {
    console.log(`SQL Server (${databaseName}, autenticación de Windows) y aplicación en http://127.0.0.1:${port}`)
  })
} catch (error) {
  console.error('No se pudo conectar a (localdb)\\MSSQLLocalDB con autenticación de Windows.')
  console.error(error.message)
  process.exit(1)
}
