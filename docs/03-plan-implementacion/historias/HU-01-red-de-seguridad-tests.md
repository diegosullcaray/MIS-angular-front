> **Documentacion:** [Indice](../../README.md) | [Plan de implementacion](../README.md) | [Estado real](../00-estado-real.md)

# HU-01 — Primeros tests de caracterización

> ✅ **Resuelta el 2026-07-26.** El proyecto no tenía target `test` configurado en
> `angular.json` (solo existía `tsconfig.spec.json`, sin builder que lo usara). Se agregó
> el target `test` con `@angular/build:unit-test` (runner Vitest) y se instalaron
> `vitest`/`jsdom` como devDependencies. 5 archivos de spec, 24 tests, todos en verde. Ver
> [`../../04-bitacora/2026-07-26-hu00-hu01-ejecucion.md`](../../04-bitacora/2026-07-26-hu00-hu01-ejecucion.md).

**Como** desarrollador del Host, **quiero** una primera red de tests sobre el estado y
los guards compartidos, **para** poder ejecutar HU-00 y las siguientes sin miedo a rupturas
silenciosas.

**Tamaño:** S &nbsp;&nbsp; **Prioridad:** 🔴 Bloqueante &nbsp;&nbsp; **Depende de:** ninguna (puede ir en paralelo con HU-00, idealmente antes)

## Contexto

`find src/app -name "*.spec.ts" | wc -l` da `0`. El sistema anterior llegó a 122k LOC con
28 specs (~9% de cobertura estructural) y eso hizo que refactorizar fuera arriesgado — su
propio plan dedicó una fase completa ("Higiene y red de seguridad") solo a escribir tests
de caracterización antes de tocar duplicados. Aquí el proyecto es nuevo: es mucho más
barato empezar ahora, con pocos archivos, que esperar a que crezca.

## Alcance

**Sí incluye:** tests de caracterización (documentan el comportamiento actual, no
diseño ideal) para las piezas que HU-00 y HU-02 van a tocar:
- `ShellStateService` (computed `esAdmin`, `esAdminSistema`, `subsistemas`)
- `authGuard` y `roleGuard` (incluida la jerarquía admin-sistema > admin-general >
  supervisor-area y el toast de acceso denegado)
- `RemoteWrapperComponent` (los 3 estados: loading/loaded/error, y que descarta
  respuestas tardías al cambiar de remote)
- `AuthService` (login → OTP → sesión, y `restaurarSesion()`)

**No incluye:** cobertura exhaustiva de toda la UI, tests E2E, ni configurar un test
runner distinto — se usa el que ya trae el CLI (Karma/Jasmine o Vitest, el que
`ng test` levante por defecto en este workspace).

## Pasos

- [ ] Verificar qué runner de test configuró `ng new` en este proyecto (`ng test --help`
      / revisar `angular.json` → `test`).
- [ ] `shell-state.service.spec.ts` — computed reaccionan a cambios de `usuarioActivo`.
- [ ] `auth.guard.spec.ts` y `role.guard.spec.ts` — casos permitido/denegado y jerarquía
      de roles.
- [ ] `remote-wrapper.component.spec.ts` — los 3 estados y el descarte de respuesta
      tardía al cambiar `remoteName` rápido (carrera de dos cargas).
- [ ] `auth.service.spec.ts` — flujo login → OTP → sesión persistida.
- [ ] `npm test` corre y pasa en verde localmente.

## Criterios de aceptación

- Dado el estado actual del código, cuando se ejecuta `npm test`, entonces los 4+ specs
  nuevos pasan y describen el comportamiento real (no el aspiracional).
- Los tests de `role.guard` fallan si alguien reintroduce el bug de "permisos que se
  acumulan entre usuarios" que tuvo el sistema anterior (H-03 del legado) — aunque hoy no
  exista ese bug aquí, el test debe poder detectarlo si apareciera.

## Archivos afectados

- Crear: `src/app/core/services/shell-state.service.spec.ts`,
  `src/app/core/guards/auth.guard.spec.ts`, `src/app/core/guards/role.guard.spec.ts`,
  `src/app/core/federation/remote-wrapper/remote-wrapper.component.spec.ts`,
  `src/app/pages/full-pages/auth/service/auth.service.spec.ts`
