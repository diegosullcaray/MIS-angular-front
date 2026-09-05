# Auditoría

Tres cosas conviven en esta carpeta: el **backlog de seguridad** (abierto, de la
auditoría de arquitectura del 14 de agosto de 2026), la **batería de pruebas de
responsive y de color** con el historial de lo que encontró, y la **auditoría de
rendimiento contra el STG original**.

| Documento | Contenido |
|---|---|
| [`02-hallazgos.md`](./02-hallazgos.md) | Hallazgos de seguridad por severidad, cada uno con su evidencia, impacto y corrección propuesta |
| [`03-plan-de-accion.md`](./03-plan-de-accion.md) | Plan por fases, con esfuerzo estimado y criterios de aceptación |
| [`04-pruebas-responsive-y-color.md`](./04-pruebas-responsive-y-color.md) | Qué cubre la batería de responsive (13 dispositivos Android/iOS) y de contraste/armonía de color sobre los tokens, y cómo correrla |
| [`05-incidencias.md`](./05-incidencias.md) | Historial de los 26 defectos que esa batería destapó y cómo se corrigió cada uno |
| [`06-incidencias-rendimiento.md`](./06-incidencias-rendimiento.md) | Auditoría contra el STG original: por qué el legado cargaba más rápido, con los 5 defectos que salieron |
| [`07-pentest-seguridad.md`](./07-pentest-seguridad.md) | Prueba de penetración: confirma con evidencia en vivo las claves en repo público y revisa cifrado, XSS, sesión y autorización |

## Seguridad — backlog abierto

Se conserva porque **la mayoría de los hallazgos críticos siguen abiertos**: es
un backlog, no un informe histórico.

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
  build). **Atención**: el guardián de esta corrección —`scripts/verificar-bundle.mjs`—
  había sido borrado, dejando `npm run build:prod` roto y la protección caída sin
  aviso. Se restauró; el detalle está en
  [`05-incidencias.md`](./05-incidencias.md) (B-07).
- **M-6 · Los archivos de entorno divergían** — tipados y alineados.
- **A-4 · Pruebas rojas** — el proyecto está en verde y la suite crece con cada
  cambio.

## Lo que quedó desfasado

Las métricas del informe (número de tests, inventario de módulos, tamaño del
bundle) son del 14 de agosto de 2026 y ya no valen: el sistema creció mucho
desde entonces. Tomá el documento por sus **hallazgos**, no por sus números. El
mapa del sistema que acompañaba a la auditoría se borró y lo reemplaza
[`02-arquitectura/01-como-funciona-el-sistema.md`](../02-arquitectura/01-como-funciona-el-sistema.md).
