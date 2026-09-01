# Seguridad — backlog abierto

Los hallazgos de la auditoría de arquitectura del **14 de agosto de 2026**, con
lo que sigue pendiente. Se conserva porque **la mayoría de los hallazgos críticos
siguen abiertos**: es un backlog de seguridad, no un informe histórico.

| Documento | Contenido |
|---|---|
| [`02-hallazgos.md`](./02-hallazgos.md) | Los hallazgos por severidad, cada uno con su evidencia, impacto y corrección propuesta |
| [`03-plan-de-accion.md`](./03-plan-de-accion.md) | Plan por fases, con esfuerzo estimado y criterios de aceptación |

## Lo que sigue abierto y es crítico

- **C-2 · Las claves AES viajan en el bundle público.** Cualquiera que descargue
  la aplicación las tiene. Requiere rotarlas y mover el cifrado al servidor.
- **C-3 · AES-128-CBC con IV fijo en cero y sin autenticación.** El mismo texto
  produce siempre el mismo cifrado, y nada garantiza que el mensaje no fue
  alterado.
- **C-4 · La autorización vive solo en el cliente.** El rol se deriva de un campo
  del perfil y los guards corren en el navegador: no hay verificación en
  servidor. Sigue además el token de relleno `'winder-session-token'` cuando el
  backend no emite uno.
- **A-5 · Sin política de seguridad de contenido (CSP).**
- **A-6 · OAuth con flujo implícito**, en vez de *code flow* con PKCE.

Los tres primeros necesitan acuerdo con el equipo de backend: no se resuelven
solo desde el frontend.

## Lo que ya se cerró

- **C-1 · Suplantación de identidad en el build de producción** — resuelto en la
  Fase 0 (`fileReplacements`, `isDevMode()` y verificación del bundle en cada
  build).
- **M-6 · Los archivos de entorno divergían** — tipados y alineados.
- **A-4 · Pruebas rojas** — el proyecto está en verde y la suite crece con cada
  cambio.

## Lo que quedó desfasado

Las métricas del informe (número de tests, inventario de módulos, tamaño del
bundle) son del 14 de agosto de 2026 y ya no valen: el sistema creció mucho
desde entonces. Tomá el documento por sus **hallazgos**, no por sus números. El
mapa del sistema que acompañaba a la auditoría se borró y lo reemplaza
[`02-arquitectura/01-como-funciona-el-sistema.md`](../02-arquitectura/01-como-funciona-el-sistema.md).
