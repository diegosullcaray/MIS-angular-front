# Hallazgos de seguridad

Riesgos identificados en el MIS. Describen el estado actual: **ninguno debe presentarse como resuelto porque el frontend lo oculte**.

## Prioridad alta — requieren cambios coordinados con backend

- Las claves criptográficas en un bundle público no constituyen secreto.
- AES-CBC con IV fijo no ofrece autenticidad ni aleatoriedad suficiente.
- La autorización solo en guards del navegador no protege el backend.
- Falta política CSP, y el flujo OAuth debe migrar a Authorization Code con PKCE.

### Evidencia en el checkout

- `src/environments/environment.ts` y `environment.prod.ts` contienen `cypherSecret` y secretos por módulo.
- `AuthService.iniciarLoginGoogle()` llama a `initImplicitFlow()`.
- `authGuard` decide el acceso por la señal local de usuario.
- `authInterceptor` excluye Winder de `Authorization` y adjunta `X-User-Role` solo a rutas Host.

El frontend, mientras tanto, debe evitar secretos nuevos, no ocultar errores y tratar el menú como presentación.

## Prioridad media — higiene verificable desde el frontend

Detectados en la [auditoría de septiembre 2026](../evidence/quality/auditoria-gobernanza-2026-09.md) y verificables de forma continua:

| Hallazgo | Detección | Estado |
|---|---|---|
| Correo institucional real en un ejemplo de JSDoc (`core/winder/instances/mod-sys-login.service.ts`) | `--regla=sin-secretos` | Abierto, corrección trivial |
| 4 lecturas de `environment` fuera de `core/` | `--regla=entorno-fuera-de-core` | Abierto |
| `core` importa de `pages` (5 casos) y `shared` de `pages/modules` (1) | `--regla=core-aislado`, `shared-aislado` | Abierto |
| Source maps o tokens en el artefacto de producción | `npm run verify:bundle` | Controlado |
| Trazas `console.*` en código productivo | `--regla=sin-console` | Sin ocurrencias |

## Brechas de configuración

| Brecha | Riesgo |
|---|---|
| El proyecto no tiene ESLint | reglas de seguridad de código sin verificación automática |
| `tsconfig.json` sin `strict: true` | menos garantías de tipo en los bordes de datos |
| No hay verificación automatizada de rutas contra menú | una ruta puede quedar accesible fuera del menú sin que nadie lo note |

Las dos primeras están pendientes de decisión por ADR ([registro de decisiones](../architecture/decision-records.md)).

## Cómo se cierra un hallazgo

Con corrección implementada, prueba reproducible y evidencia de que el riesgo no reaparece en build o E2E. La existencia de un guard de frontend no cuenta como evidencia de autorización ([pentest](./pentest.md)).
