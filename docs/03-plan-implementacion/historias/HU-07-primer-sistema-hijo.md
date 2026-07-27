> **Documentacion:** [Indice](../../README.md) | [Plan de implementacion](../README.md) | [Guia Sistemas Hijos](../../02-arquitectura/03-guia-sistemas-hijos.md)

# HU-07 — Primer sistema hijo real (`mis-remote-reportes`) end-to-end

**Como** producto, **quiero** un primer Remote real integrado al Host, **para** validar
que la arquitectura de Native Federation funciona fuera de la teoría y de la Fake API.

**Tamaño:** L &nbsp;&nbsp; **Prioridad:** 🟡 Media &nbsp;&nbsp; **Depende de:** HU-00, HU-02 (rutas del Host estables), HU-06 (IAM real para asignar permisos al remote)

## Contexto

Corresponde a la antigua Fase 8. La guía completa de cómo construir un sistema hijo ya
existe en [`03-guia-sistemas-hijos.md`](../../02-arquitectura/03-guia-sistemas-hijos.md),
con `mis-remote-reportes` como ejemplo transversal (puertos 4205/8085). Esta HU es la
primera vez que esa guía se ejecuta de punta a punta, así que además de construir el
Remote, valida que la guía sea correcta y completa.

## Alcance

**Sí incluye:** repositorio `mis-remote-reportes` (frontend Angular Remote + backend
Spring Boot propio + base de datos propia), registro en `federation.manifest.json` y en
`/inicio/sistemas` (o `/admin/sistemas` si HU-02 cambió el prefijo) con su estructura y
permisos por rol, validación de las reglas RN-01..RN-06.

**No incluye:** funcionalidad de negocio completa del módulo de Reportes — el objetivo es
validar la integración (carga, error, deep-linking, tema compartido, aislamiento), no
migrar todo el módulo `reportes` de 75k LOC del sistema legado en esta HU.

## Pasos

- [ ] Scaffold `mis-remote-reportes`: frontend Native Federation (expone `./Component`) +
      backend Spring Boot propio + BD propia.
- [ ] Frontend: usa el preset `MisTheme` compartido, lee únicamente signals de solo
      lectura del Host (`usuarioActivo`, `esAdmin`) — nunca los muta (RN-03).
- [ ] Backend: valida el JWT emitido por el Host (HU-04) y comprueba que el claim
      `subsistemas` incluye el slug `subsistema-reportes`.
- [ ] Registrar la URL del `remoteEntry.json` en `federation.manifest.json` y dar de alta
      el sistema en la Gestión de Sistemas del Host (estructura + permisos por rol).
- [ ] Validar manualmente CA-01..CA-05 del PRD con este Remote real (no simulado):
      carga sin reload, sin iframes, sin degradar rendimiento, error elegante si cae,
      skeleton mientras carga.

## Criterios de aceptación

- Dado el Remote desplegado y registrado, cuando un usuario con el subsistema habilitado
  navega a su ícono en el sidebar, entonces el Remote carga sin recargar el navegador
  (CA-01) y sin iframes (CA-02).
- Dado el Remote caído, cuando el usuario navega a su ruta, entonces el Host muestra
  `RemoteErrorComponent` sin romper la shell (CA-04).
- Dado un usuario sin el subsistema habilitado en su rol, cuando intenta acceder por URL
  directa, entonces el backend del Remote rechaza la petición (claim `subsistemas` no
  contiene el slug).

## Archivos afectados

- Nuevo repositorio: `mis-remote-reportes/` (frontend + backend + BD propia)
- `public/federation.manifest.json` (Host) — se agrega la entrada real
