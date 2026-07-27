> **Documentacion:** [Indice](../../README.md) | [Plan de implementacion](../README.md) | [TRD](../../01-canon/03-trd.md)

# HU-06 — Conectar el Host al backend real y retirar `fakeApiInterceptor`

**Como** usuario del Host, **quiero** que la aplicación use datos reales de PostgreSQL en
vez de la Fake API en memoria, **para** que el sistema sea utilizable en producción.

**Tamaño:** M &nbsp;&nbsp; **Prioridad:** 🟡 Media &nbsp;&nbsp; **Depende de:** HU-04, HU-05

## Contexto

Cierre de la antigua Fase 7. El TRD §4 ya documenta que `fakeApiInterceptor` está en
`provideHttpClient(withInterceptors([authInterceptor, fakeApiInterceptor]))`
precisamente para retirarse cuando el backend real exista — no requiere rediseño, solo
apuntar `HttpClient` al backend real y borrar el interceptor de simulación.

## Alcance

**Sí incluye:** retirar `fakeApiInterceptor` de `app.config.ts`, configurar la URL base
del backend real (por entorno), validar end-to-end los flujos de login/IAM/sistemas
contra el backend de HU-04/HU-05.

**No incluye:** borrar `core/fake-api/` del repo todavía — se conserva por un tiempo como
modo de desarrollo local sin backend (documentado como flag/entorno), y se retira en una
HU posterior una vez el backend real sea estable en todos los entornos.

## Pasos

- [ ] Configurar `environment.ts` / variable de build con la URL base del backend real.
- [ ] Retirar `fakeApiInterceptor` de la lista de `withInterceptors(...)` en
      `app.config.ts` (o condicionarlo a un flag de entorno de desarrollo local).
- [ ] Probar manualmente los 3 flujos completos: login+MFA, CRUD de usuarios/roles,
      CRUD de sistemas — contra el backend real.
- [ ] Ejecutar los tests de HU-01 contra el backend real (no la Fake API) para confirmar
      que siguen pasando.

## Criterios de aceptación

- Dado el Host apuntando al backend real, cuando se hace login con un usuario existente
  en la base de datos, entonces el flujo MFA completo funciona igual que con la Fake API.
- `grep fakeApiInterceptor src/app/app.config.ts` no aparece en la configuración de
  producción (o aparece solo detrás de un flag explícito de entorno local).

## Archivos afectados

- `src/app/app.config.ts`
- `src/environments/environment*.ts` (o el mecanismo de configuración de entorno que use
  el proyecto)
