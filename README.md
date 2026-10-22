# Sistema de soporte al voto — Trabajo de interfaz

Prototipo de **sistema de votación para Córdoba Capital**, hecho con **React + Vite** y persistencia
en **SQL Server LocalDB**. La boleta recrea las candidaturas municipales reales del 23 de julio de
2023; los votos y las mesas son datos de prueba, no resultados ni padrones oficiales. Incluye una
interfaz para cada uno de los **cuatro tipos de participantes** y aplica los **criterios
heurísticos de usabilidad de Jakob Nielsen**, priorizados según lo que cada rol necesita.

---

## Cómo levantarlo

Necesitás **Node.js 18.19 o superior**, SQL Server LocalDB con la instancia `MSSQLLocalDB` y ODBC
Driver 17 for SQL Server.

```bash
npm install      # instala dependencias
npm run dev      # abre la app en http://localhost:5173 y conecta con SQL Server LocalDB
npm run build    # compila para producción
npm start        # sirve la compilación y la API en http://localhost:4173
```

---

## Los 4 participantes y sus interfaces

| Rol | Interfaz | Prioridades |
|-----|----------|-------------|
| **Votante** | Flujo de 3 pasos + comprobante con deshacer | Deshacer errores, aprendizaje rápido, velocidad |
| **Candidato** | Panel de transparencia + solicitar recuento | Prevención, recuperación, eficiencia |
| **Responsable** | Panel de mesas + registro de incidentes | Eficiencia, prevenir/recuperar errores, aprendizaje |
| **Tribunal** | Panel de integridad, rendimiento y auditoría | Prevención de errores, velocidad, recuperación |

La boleta incluye a las candidaturas oficiales de 2023 (intendente y **viceintendente** cuando se
verificó la fórmula) y la opción
**Voto en blanco**. En la pantalla inicial se elige el rol con el que se quiere ingresar.

---

## El informe (documento del trabajo)

El documento con las **imágenes de las interfaces, referencias y texto explicativo** está
**resguardado** en la carpeta `documento/`, fuera de la aplicación (no aparece en la página ni se
sirve por el navegador):

- `documento/informe.html` → abrilo **haciendo doble clic** en el archivo (o clic derecho →
  Abrir con → tu navegador) y usá **Imprimir → Guardar como PDF** para entregar.

Para que aparezcan las figuras, guardá tus capturas en `documento/img/` con los nombres
`figura-1.png` … `figura-10.png` (hay una guía en `documento/img/LEEME.txt`). Si falta una imagen,
el informe muestra un recuadro indicando qué archivo agregar.

---

## Estructura

```
trabajo de interfaz/
├── index.html
├── documento/
│   ├── informe.html            # Documento del trabajo (resguardado, imprimible a PDF)
│   └── img/                    # Tus capturas (figura-1.png …)
├── src/
│   ├── main.jsx
│   ├── App.jsx                 # Proveedores + selección de rol
│   ├── styles.css
│   ├── data/
│   │   └── election.js         # Ciudad, candidatos, mesas y roles
│   ├── state/
│   │   └── ElectionContext.jsx # Estado: votos, mesas, incidentes, auditoría
│   ├── hooks/
│   │   └── useTheme.js         # Tema claro/oscuro
│   └── components/
│       ├── common/             # UI reutilizable, avisos, diálogos
│       ├── RoleSelect.jsx      # Pantalla de selección de rol
│       ├── AppHeader.jsx       # Barra superior
│       ├── voter/              # Flujo del votante
│       ├── candidate/          # Panel del candidato
│       ├── official/           # Panel del responsable
│       └── tribunal/           # Panel del tribunal
```

---

## Seguridad de usabilidad destacada

- **Deshacer el voto:** el votante tiene 15 segundos para revertir su voto desde el comprobante.
- **Doble confirmación** antes de votar, cerrar mesas o certificar resultados.
- **Comprobante** con número de folio para dar confianza de que el voto se contó.
- **Recuperación de errores:** validaciones claras, resolución de incidentes y solicitud de recuento.
- **Registro de auditoría:** todas las acciones quedan registradas para el Tribunal.

---

## Cambiar los datos de la elección

Editá `src/data/election.js` (ciudad, fecha, candidaturas y mesas). La aplicación muestra como
intendente actual a Daniel Passerini y como viceintendente a Javier Pretto, según la Municipalidad
de Córdoba.

### Fuentes de las candidaturas

- [Resolución 17 de la Junta Electoral Municipal](https://tribunaldefaltas.cordoba.gov.ar/wp-content/uploads/2023/06/Resolucion-n%C2%B017-Junta-Electoral-Municipal.pdf): oficialización de candidaturas.
- [La Nación: las listas de la elección municipal de 2023](https://www.lanacion.com.ar/politica/quienes-son-los-candidatos-a-intendente-en-cordoba-capital-nid21072023/): nombres y partidos de las 11 listas.
- [Municipalidad de Córdoba: autoridades](https://cordoba.gob.ar/areas-de-gobierno-2025/): intendente y viceintendente actuales.

Al iniciar, el servidor se conecta a `(localdb)\MSSQLLocalDB` con autenticación integrada de
Windows. Crea la base `VotoIntendente` y las tablas `dbo.Votos` y `dbo.ElectionState` si todavía no
existen. Guarda los totales por opción, el estado de las mesas, incidentes, auditoría y una huella
HMAC del DNI en `dbo.VotantesRegistrados` para impedir votos repetidos aunque se cierre y vuelva a
abrir la app. El DNI completo no se guarda. La clave para generar esas huellas queda en
`data/dni-hmac-key` y no se sube al repositorio. “Reiniciar demo” borra las huellas junto con los
votos.
