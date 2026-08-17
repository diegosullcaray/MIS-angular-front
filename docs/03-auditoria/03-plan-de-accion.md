# Plan de acción

Cuatro fases ordenadas por riesgo, no por facilidad. La fase 0 contiene lo que no debería
esperar a la próxima planificación.

El orden importa: activar `fileReplacements` (C-1) antes de alinear los entornos (M-6) rompe
la aplicación, y activar el modo estricto de TypeScript (A-1) antes de tener CI (A-3) deja el
proyecto sin red mientras se corrige la cascada de errores.

---

## Fase 0 — Contención inmediata · APLICADA el 15/08/2026

**Objetivo: que el build de producción deje de suplantar identidades.**

| # | Acción | Hallazgo | Estado |
|---|---|---|---|
| 1 | Declarar `export interface Environment` y tipar ambos archivos de entorno. Eliminar las claves muertas | M-6 | ✅ Hecho — 9 claves eliminadas |
| 2 | Alinear `environment.prod.ts`: añadir `externalLinks.helpdesk` | M-6 | ✅ Hecho |
| 3 | Añadir `fileReplacements` a la configuración `production` de `angular.json` | C-1 | ✅ Hecho |
| 4 | Cambiar el guardián de `devUser` a `isDevMode()`, conservando la capacidad en desarrollo | C-1 | ✅ Hecho — `AuthService.emailDePrueba()` |
| 5 | Corregir la aserción del spec y añadir pruebas de regresión | C-1 | ✅ Hecho — 2 pruebas nuevas |
| 6 | Verificación automática del bundle en cada build de producción | C-1 | ✅ Hecho — `npm run verify:bundle` |
| 7 | Sustituir el token de relleno `'winder-session-token'` por un fallo explícito | C-4 | ⬜ **Pendiente** |

**Criterio de aceptación — cumplido.** El bundle de producción no contiene ningún correo de
desarrollo ni `localhost`, `production` vale `true` y `redirectUri` apunta a
`https://stg.confianza.pe/login`. El build de desarrollo conserva `devUser` operativo.

**Queda abierto de esta fase** el punto 7. Se dejó fuera a propósito: cambiar el
comportamiento ante un backend que no emite `sid` puede romper el acceso si ese caso ocurre
hoy en algún flujo, así que conviene confirmarlo antes con el equipo del backend Ant.

---

## Fase 1 — Red de seguridad

**Objetivo: que nada de la fase 0 pueda volver a colarse sin que alguien se entere.**

| # | Acción | Hallazgo | Esfuerzo |
|---|---|---|---|
| 8 | Verificar la propagación del código de salida de `ng test`; si no lo propaga, llamar a Vitest directamente | A-4 | 2 h |
| 9 | Arreglar las 22 pruebas rojas de los 6 archivos afectados | A-4 | 1-2 días |
| 10 | `ng add @angular-eslint/schematics` con las reglas recomendadas más `no-floating-promises` | A-2 | 4 h |
| 11 | Flujo de CI: `npm ci` → `lint` → `test` → `build --configuration production` → `playwright test`, con protección de rama | A-3 | 1 día |
| 12 | Regla de CI que falle si aparece un secreto o un `localhost` en `dist/` | C-1, C-2 | 2 h |

**Criterio de aceptación.** Un *pull request* con una prueba rota no se puede integrar.

**Total: 3 a 4 días.**

---

## Fase 2 — Modelo de seguridad

**Objetivo: que la autorización deje de depender del navegador.** Esta fase requiere
coordinación con el equipo del backend Ant; conviene arrancarla en paralelo con la fase 1.

| # | Acción | Hallazgo | Esfuerzo |
|---|---|---|---|
| 13 | Acordar con backend: token de sesión emitido y verificado en servidor en cada petición Winder, con el `email` del `Strand` validado contra la sesión | C-2, C-4 | Diseño conjunto |
| 14 | Rotar las claves AES expuestas en el historial de Git | C-2 | Coordinado |
| 15 | Migrar OAuth a *code flow* con PKCE y reactivar `strictDiscoveryDocumentValidation` | A-6 | 1 día |
| 16 | Definir CSP y cabeceras de seguridad en el servidor web, con `frame-src` para Power BI | A-5 | 1 día |
| 17 | IV aleatorio por mensaje y migración a AES-GCM con `SubtleCrypto`; requiere hacer asíncrono `winderConfig()` | C-3 | 2-3 días |
| 18 | Ampliar el modelo de roles más allá de los dos derivados de `tip_use` | C-4 | Depende del negocio |

**Criterio de aceptación.** Una petición Winder construida a mano con las claves del bundle,
pero sin sesión válida, es rechazada por el backend.

**Total: 1 a 2 semanas, en función del backend.**

---

## Fase 3 — Robustez y rendimiento

**Objetivo: que el sistema aguante el crecimiento.** Sin urgencia, pero cada mes que pasa sale
más caro: la conversión al modo estricto crece con cada módulo migrado.

| # | Acción | Hallazgo | Esfuerzo |
|---|---|---|---|
| 19 | Activar `strict: true`, módulo por módulo | A-1 | 1-2 semanas |
| 20 | Activar `strictTemplates` | A-1 | 3-5 días |
| 21 | Hacer que `prepare()` de `WinderService` devuelva un objeto inmutable | M-1 | 4 h |
| 22 | `OnPush` como predeterminado en los esquemas y aplicación progresiva | M-2 | 2-3 días |
| 23 | `HttpContextToken` para peticiones silenciosas en `loadingInterceptor` | M-3 | 3 h |
| 24 | `MenuStgService`: marcar la caché en el `next`, limpiarla en el `error`, y estado de error recuperable en el sidebar | M-4 | 3 h |
| 25 | Renovación de sesión por actividad y diálogo de aviso previo | M-7 | 1 día |
| 26 | Reducir el fragmento inicial por debajo de 500 kB y bajar `maximumError` para que el presupuesto sea vinculante | M-5 | 1-2 días |
| 27 | `ErrorHandler` global y monitorización conectada a él | B-2, B-3 | 2 días |
| 28 | `takeUntilDestroyed()` en los helpers de `AntService`, o migración a `httpResource()` | M-8 | 2-3 días |
| 29 | Mover los 904 archivos legados de `docs/07-modulos/` fuera del repositorio | B-1 | 2 h |
| 30 | Reescribir el `README.md` de la raíz | B-2 | 3 h |

**Total: 4 a 6 semanas.**

---

## Lo que ya está bien y conviene no tocar

Vale la pena registrarlo para que ninguna refactorización futura lo deshaga por accidente:

- **La estructura por capas del protocolo Winder.** `ModXxx → AntService → WinderService →
  RESTService` es una separación limpia: ningún componente conoce el protocolo. El problema de
  C-2 y C-3 es el modelo de confianza, no la arquitectura.
- **Zoneless con señales.** Decisión moderna, bien ejecutada y coherente en todo el código.
- **`ShellStateService` con señales privadas y `asReadonly()` público.** Un contrato de estado
  compartido difícil de corromper por accidente.
- **La convención de módulo** (`components/`, `ui/`, `services/`, `models/`, `utils/`),
  aplicada de forma uniforme en los doce módulos. Es lo que hace el código predecible.
- **`ngsw-config.json` no cachea respuestas del backend.** Correcto para datos financieros.
- **La restauración de sesión con `provideAppInitializer`** antes del primer render.
- **Los comentarios explican el porqué**, no el qué: las notas sobre el orden de las rutas de
  `categorizacion`, el `[class.hidden]` del selector de jerarquía o el `startsWith('/app/dashboard/')`
  del sidebar documentan decisiones que de otro modo se repetirían como errores.
- **1013 pruebas unitarias y 14 especificaciones E2E.** La base es sólida; solo hay que
  ponerla en verde y hacerla vinculante.
