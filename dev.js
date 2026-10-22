import { spawn } from 'node:child_process'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('.', import.meta.url))
const node = process.execPath
const server = spawn(node, [resolve(root, 'server.js'), '--api-only'], { cwd: root, stdio: 'inherit' })
const vite = spawn(node, [resolve(root, 'node_modules/vite/bin/vite.js')], { cwd: root, stdio: 'inherit' })
let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  server.kill()
  vite.kill()
  process.exitCode = code
}
server.on('exit', (code) => { if (!stopping && code !== 0) stop(code || 1) })
vite.on('exit', (code) => { if (!stopping) stop(code || 0) })
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
