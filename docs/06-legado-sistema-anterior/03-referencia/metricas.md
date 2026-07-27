# Métricas de seguimiento

Registro de indicadores al cierre de cada fase. Ver [plan](../01-analisis/03-plan-refactorizacion.md#indicadores).

---

## Build

Medido con `ng build` (sin argumentos), que es lo que ejecuta `npm run build`.

| Métrica | Antes (Fase 0) | Después (Fase 0) | Cambio |
|---|---|---|---|
| Tamaño total de `dist/` | **70 MB** | **28 MB** | **−60%** |
| Source maps publicados | **160** (27 MB) | **0** | eliminados |
| `vendor.js` | 8.0 MB sin minificar | — (integrado y minificado) | — |
| Bundle inicial (raw) | n/d (sin optimizar) | **2.73 MB** | — |
| Bundle inicial (transferencia) | n/d | **573 kB** | — |
| `devUser` de desarrollo en el bundle | **presente** | ausente | corregido |
| `fileReplacements` aplicado | **no** | sí | corregido |
| Cifrado de `localStorage` activo | **no** (`production: false`) | sí | corregido |

**Causa:** `angular.json` tenía `"defaultConfiguration": ""` en el target `build`, por lo que
`ng build` usaba las opciones base de desarrollo. Corregido a `"production"`.

### Presupuestos

| Presupuesto | Antes | Después | Motivo |
|---|---|---|---|
| `initial` aviso | 500 kb | 3 mb | El valor anterior no era alcanzable; 3 mb da margen sobre los 2.73 mb reales |
| `initial` error | 5 mb | 4 mb | Un error a 5 mb nunca podía dispararse |
| `anyComponentStyle` aviso | 2 kb | 4 kb | Ajustado al tamaño real de los estilos existentes |

### Configuraciones disponibles

| Comando | Optimizado | Source maps | Environment |
|---|---|---|---|
| `ng build` | ✅ | ❌ | `environment.prod.ts` |
| `ng build --configuration staging` | ✅ | ✅ | `environment.staging.ts` (nuevo) |
| `ng serve` | ❌ | ✅ | `environment.ts` |

---

## Tests

| Métrica | Antes (Fase 0) | Después (Fase 0) |
|---|---|---|
| La suite **compila** | ❌ **no** | ✅ sí |
| Tests ejecutados | **0** | 38 |
| Tests en verde | 0 | 13 |
| Tests en rojo | 0 | 25 |
| Archivos `.spec.ts` | 28 | 30 |

> **Hallazgo no previsto en el análisis inicial:** la suite de tests **no compilaba**, por lo que
> ningún spec del proyecto se había ejecutado nunca. `src/test.ts` carga todos los specs con
> `require.context`, así que un único archivo roto inutilizaba la suite completa. Tres causas:
>
> 1. `report-crs-v5.component.spec.ts` referenciaba `ReportCrsV5Component` cuando la clase se
>    llama `ReportCrsv5Component` (diferencia de mayúscula).
> 2. `tsconfig.spec.json` declaraba el tipo `googlemaps`, pero el paquete instalado es
>    `@types/google.maps` (el tipo correcto es `google.maps`, ya usado en `tsconfig.app.json`).
> 3. `app.component.spec.ts` era la plantilla del CLI sin adaptar: comprobaba `app.title` como
>    string cuando `title` es el servicio `Title` inyectado.
>
> Los **25 tests en rojo son preexistentes**: specs boilerplate `should create` generados por el
> CLI que declaran un componente sin proveer sus dependencias. Nunca llegaron a ejecutarse.
> Se abordan en la Fase 1 (Tarea 1.3).

### Tests añadidos en la Fase 0

| Archivo | Tests | Cubre |
|---|---|---|
| `core/data/remote/winder/winder.service.spec.ts` | 4 | Enrutado `/v1/p` vs `/v1/pf`, no reutilización de `FormData` ni de strands |
| `system/admin/services/navigation.service.spec.ts` | 5 | Construcción del árbol de menú, rutas de hijos, no acumulación entre perfiles |
| `app.component.spec.ts` | 2 | Creación del componente raíz |

---

## Lint (Fase 1 — Tarea 1.1)

TSLint 6.1 (deprecado desde 2019) sustituido por ESLint 8.57 + `@angular-eslint` 14.4.

> La migración estaba **a medias** al retomarla: `ng add @angular-eslint/schematics` había
> borrado `tslint.json` y escrito `.eslintrc.json`, pero no dejó instalados
> `@typescript-eslint/parser` ni `@typescript-eslint/eslint-plugin`, así que `ng lint`
> fallaba al arrancar. Se completó fijando las 7 dependencias con versión explícita.

### Línea base — solo reglas de `@angular-eslint/recommended`

Volcado completo en [`baseline-eslint.txt`](./baseline-eslint.txt).

| Métrica | Valor |
|---|---|
| Archivos analizados | 944 |
| Errores | 143 |
| Avisos | 31 |

| Regla | Ocurrencias |
|---|---|
| `@angular-eslint/no-empty-lifecycle-method` | 69 |
| `@angular-eslint/component-selector` | 41 |
| `@angular-eslint/use-lifecycle-interface` | 31 |
| `@angular-eslint/no-output-on-prefix` | 16 |
| `@angular-eslint/no-input-rename` | 9 |
| Resto | 8 |

### Línea base — con las reglas de contención activas

| Regla de contención | Ocurrencias | Hallazgo relacionado |
|---|---|---|
| `@typescript-eslint/no-explicit-any` | **3.154** | [H-10](../01-analisis/02-analisis-refactorizacion.md#h-10) (el análisis estimó 3.014 por `grep`) |
| `@typescript-eslint/no-unused-vars` | **921** | — |
| `rxjs/no-ignored-subscription` | **581** | [H-11](../01-analisis/02-analisis-refactorizacion.md#h-11) (581 de las 671 suscripciones se ignoran) |
| `no-console` | **358** | [H-17](../01-analisis/02-analisis-refactorizacion.md#h-17) |
| | **5.045 avisos + 143 errores** | |

Las cuatro reglas están en `warn` **a propósito**: la deuda existente no puede bloquear el
trabajo, pero la nueva no entra. El mecanismo es `npm run lint:nuevos`, que ejecuta ESLint
con `--max-warnings 0` **solo sobre los archivos que la rama modifica** respecto a `main`.

> **Desviación respecto al plan:** el plan definía `lint:nuevos` como una línea de npm script
> con `$(git diff ...)`. Esa sintaxis solo funciona en shells POSIX y el equipo trabaja en
> Windows, así que se implementó como [`scripts/lint-nuevos.js`](../scripts/lint-nuevos.js),
> que además resuelve la rama base automáticamente (`origin/main` → `main` → `HEAD~1`) e
> incluye los cambios sin commitear.

`rxjs/no-ignored-subscription` está desactivada en `*.spec.ts`: `TestBed` destruye el
entorno tras cada test, así que guardar la suscripción no aporta nada.

### Coste de dejar el guardarraíl en verde

`lint:nuevos` marcaba 17 avisos sobre los 8 archivos que tocó la Fase 0. Aplicando la
restricción global del plan («el código tocado se tipa»), se eliminaron tipando:

| Archivo | Cambio |
|---|---|
| `navigation.service.ts` | Nueva interfaz `IMenuRecord` (contrato del `user_mr` del backend); 6 `any` eliminados |
| `winder.service.ts` | Interfaces `IWinderRequestOptions` e `IWinderConfig`; import muerto `jsonStringifyIgnoringFields` eliminado |
| `navigation.service.spec.ts` | 2 `any` → `unknown` |

Solo tipos: `npx tsc -p tsconfig.app.json --noEmit` en verde y la suite sin cambios
(13 verdes / 25 rojos preexistentes).

---

## Logging (Fase 1 — Tarea 1.4)

Cierra [H-17](../01-analisis/02-analisis-refactorizacion.md#h-17).

| Métrica | Antes | Después |
|---|---|---|
| `console.*` directos (regla `no-console`) | **369** | **0** |
| Severidad de `no-console` | aviso, con `console.error` permitido | **error, sin excepciones** |
| Políticas de logging conviviendo | 3 | 1 |
| Archivos autorizados a escribir en consola | todos | **1** (`core/shared/logger.service.ts`) |

### Las tres políticas que había

1. `core/shared/debug.util.ts` — `printLog`/`printWarn`/`printError`/`printTable`, todas
   silenciadas en producción.
2. `modules/reportes/legacy/support/services/logger.service.ts` — un `LoggerService` propio
   del módulo, con su propia comprobación de `environment.production`.
3. 369 `console.*` sueltos, sin ninguna comprobación.

Ahora las tres desembocan en `core/shared/logger.service.ts`. `debug.util.ts` y el logger de
`legacy` conservan su API pública —hay cientos de llamadas— pero ya no deciden nada.

### Cambio de comportamiento (deliberado)

| Caso | Antes | Ahora |
|---|---|---|
| `printError` en producción | **silenciado** | se emite |
| `console.log` suelto en producción | se emitía | silenciado |
| Nivel en producción | n/d | solo `ERROR` |
| Nivel en desarrollo | n/d | desde `DEBUG` |

Que `printError` no dejara rastro en producción era el peor de los dos defectos: un fallo en
una entidad financiera desaparecía sin registro.

### Cómo se hizo

La sustitución de las 408 llamadas (109 archivos) se automatizó recorriendo el **AST de
TypeScript**, no con expresiones regulares: así los `console.log` que viven dentro de
comentarios o de cadenas quedan fuera por construcción. Fue necesario — de los 729 `console.`
que encuentra un `grep`, **casi la mitad están comentados**.

`src/app/core` no necesitó ni un cambio: sus 6 `console.*` ya estaban comentados.

### Verificación

| Comprobación | Resultado |
|---|---|
| `npx tsc -p tsconfig.app.json --noEmit` | exit 0 |
| `npm run build` | exit 0 · 2.73 MB / **573.73 kB** (antes 573.41 kB) |
| `npm test` | **113 verdes**, 0 rojos |
| Cobertura de sentencias | 35.98% (subiendo desde 34.69%) |
| `no-console` con severidad error | **0 violaciones** en 944 archivos |

---

## Código

Sin cambios en la Fase 0 — la reducción de LOC es objetivo de la Fase 2.

| Métrica | Base | Meta Fase 2 | Meta Fase 5 |
|---|---|---|---|
| LOC totales | 122.000 | 108.000 | 85.000 |
| NgModules | 339 | 200 | <100 |
| Ocurrencias de `: any` | 3.014 | 2.400 | <500 |
| Componentes `OnPush` | 1 | 1 | >240 |
| Componentes `standalone` | 0 | 80 | 250 |
| `console.log` directos | 671 | 0 | 0 |
| Secretos en `src/` | 8 | 8 | **0** |
