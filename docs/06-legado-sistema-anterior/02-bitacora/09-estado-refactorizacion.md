# Estado de la refactorización — qué se elimina, qué se mueve, qué sigue

> Documento de lectura rápida para retomar el trabajo entre sesiones. Complementa (no reemplaza)
> `doc/01-analisis/03-plan-refactorizacion.md` (el plan completo) y las bitácoras detalladas:
> `doc/02-bitacora/08-fase1-fase2.md` (cierre de Fase 1 y arranque de Fase 2),
> `doc/02-bitacora/10-checkpoint-tarea23.md` (Tarea 2.3 diff-por-diff) y
> `doc/04-componentes/stg-table.md` (diseño de la tabla unificada). Actualizado 2026-07-26.

## Resumen ejecutivo

| Fase | Estado |
|---|---|
| Fase 0 — Estabilizar y medir | Cerrada |
| **Fase 1 — Higiene** | **Cerrada** (ESLint, selectores duplicados, tests de caracterización, `LoggerService`, código comentado) |
| **Fase 2 — Consolidar duplicados** | **En curso.** Tarea 2.1 (H-07) ✅ · Tarea 2.2+2.3 (H-06 completo) ✅ · Tarea 2.4 (H-08, `incentivos`) **bloqueada en respuesta de negocio** · Tarea 2.5 (Kaypacha) sin empezar · Tarea 2.6 (H-16, NgModules) **en curso, Paso 1 a medio hacer** |
| Fase 3-5 y Fase X | No iniciadas |

**Rama de trabajo:** `refactor/fase-1-higiene`. Desde la última vez que se escribió este
documento (commit `57fc2d9`) se hicieron **26 commits** que cierran por completo H-06 y dejan
documentada (sin tocar código) la parte de H-08 que exige negocio.

---

## Qué se ha ELIMINADO

| Qué | Commit(s) | Motivo |
|---|---|---|
| `modules/incentivos2/` completo, `Kaypacha2/ranking/`, `comitecre/`, `desempeno-social/`, `ChartOptionsManager`, `FaIconService` | `433c067` (sesión anterior) | Huérfanos, cero referencias |
| 3 copias locales de `ModReportesEService` | `b2a10f8` (sesión anterior) | Unificadas en `core/data/remote/instances/` |
| `core/screen/components/stg-table4/` | `507d570`+`57fc2d9` (sesión anterior) | Colapsado sobre `stg-table2` (Tarea 2.2) |
| **`core/screen/components/stg-table/`** completo (component.ts/html/scss + interface.ts) | `031196c`, `f1096e5` | H-06 cerrado: sus 22 consumidores reales migraron a `stg-table2` (ver detalle abajo). `stg-table.util.ts` **se conservó** — utilidades genéricas (`prepareDataForPagination`, `STG_GRID_STYLE`, `STG_INPUT_TABLE_BACKGROUND`) sin relación con el componente, usadas por 17 archivos |
| **`core/screen/components/stg-table3/`** completo (component + service + util) | `031196c` | Su único consumidor real (`demo-table3`) era un demo, no una pantalla de negocio — confirmado con el usuario |
| **`modules/reportes/repositorio/demo-table3/`** completo + su ruta `/demo-table3` en `cartera-routing.module.ts` | `031196c` | Ídem — ruta real pero de playground |
| `StgTableComponent`/`StgTable3Component` de `shared-cwc.module.ts` | `031196c`, `f1096e5` | Ya no tienen consumidores |
| Providers muertos de `StgTable3Service` en `mon-imr.module.ts`/`mon-salidas.module.ts` | `f1096e5` | Nunca se inyectaba en ningún componente de esos módulos — residuo de copiar-pegar sin relación con `demo-table3` |

## Qué se ha MOVIDO / CONSOLIDADO

**H-06 completo: la tabla unificada es `stg-table2`.** El plan escrito decía que la base correcta
era `stg-table3` (única tipada); el inventario real de 82 consumidores mostró lo contrario —
`stg-table3` tenía 1 solo consumidor (un demo) y `stg-table2` ya era el estándar de facto con 60.
Se documentó la desviación y se extendió `stg-table2` en su lugar (`doc/04-componentes/stg-table.md`).

Capacidades portadas de `stg-table` v1 a `stg-table2` (todas con test de caracterización):

| Capacidad | Commit | Para qué |
|---|---|---|
| `onEditCell` (edición inline) | `4a3286c` | Columnas `format.type:'input'` renderizan un `<input>` real en vez de pasar por el pipe |
| `actions`/`actionTrigger` (botones con diálogo) | `b638958` | Requirió inyectar `MatDialog` en el constructor |
| `loadingObs` (override opcional) | `7ec1263` | Distinguir "cargando" de "búsqueda sin resultados" |
| `resolveFormatType` (edición condicional por fila) | `4df6220` | Columnas editables o no según reglas de negocio evaluadas por fila, no por columna |
| `globalStyle` con passthrough de `height`/`width` | `96e7685` | v1 sí soportaba fijar alto de contenedor; el fix corrigió retroactivamente 6 migraciones previas que lo habían perdido sin documentarlo |
| Escape hatch `type:'raw'` en `DynamicFormatPipe` | `3da34a5` | Formateadores arbitrarios (`customValueFormatter`/`type:'custom_r'` de v1) que devuelven una cadena ya formateada |
| Mapeo `type:'input'` estático en `mapStgTableV1Headers` | `49c3e7f` | Headers 100% dinámicos del backend con columna editable fija |

**Los 22 consumidores originales de `stg-table` v1 migraron a `stg-table2`**, un dominio por
commit (`9fdf6b1` los 5 "pickers" · `c056b3b` grupo actividades/corresponsales · `bc43dc2`
`pre-linea-simple`+4 reusos+`pre-act-cartera-creditos` (el de mayor riesgo, edición con cálculo en
cascada) · `96e7685` `pre-ges-seg-tablero-verificacion` (iconizer) · `fd00651`
`pre-ges-sis-responsables`+`segui-incentivos-sec` · `c378792` `rep01-comite`+
`captacion-canal-operacion` · `b26ded9` `captacion-canal-comercial` · `3da34a5`
`rep01-dashboard-clientes` · `49c3e7f` `esg` · `d70bb78` `rep01-movimiento-clientes` (11 tablas) ·
`f63124e` `rep01-precosechas` · `d297be4` `report-crs-v6`, con el defecto D-02 preservado
intacto). Detalle diff-por-diff completo en `doc/02-bitacora/10-checkpoint-tarea23.md`.

Se extrajo `mapStgTableV1Headers` (`stg-table2.util.ts`) como función compartida para traducir
headers `type:'…'` de v1 al esquema `format:{…}` de v2, en vez de duplicar la traducción en cada
consumidor migrado.

## Qué NO se tocó (fuera de alcance o defectos preservados a propósito)

- `reportes/legacy/**`: excluido de Fase 2, la Fase X lo borra entero (H-09).
- `report-crs-v6.component.ts` líneas 199-205 (defecto D-02): la asignación de `this.report` sigue
  comentada. El test de caracterización sigue en verde, confirmando que no se tocó.
- `esg.component.ts`: `tableConf3`/`tableConf4` nunca se asignaban en v1 (import inexistente) —
  preservado tal cual, tabs 3/4 siguen usando la config por defecto.
- `rep01-precosechas.component.html`: usa `dataSource1`, una propiedad que no existe (bug
  encontrado de paso, además del ya documentado `headerDefs` nunca asignado) — preservado tal cual.
- Sticky por columna (`sticky:true` en headers): confirmado que **no tiene ningún efecto real**
  en `stg-table2` hoy (`body.stickyCols` declarado en el config por defecto, nunca leído en el
  componente). Afecta a ~10+ consumidores. Gap documentado, no corregido — fuera de alcance de
  esta migración puntual.

## Hallazgo de seguridad (no relacionado con la tabla, encontrado de paso)

`ranking-k/detallek.component.ts` y `ranking-k/principal.component.ts` usan `eval()` sobre JSON
que devuelve el backend para construir el `dataSource` — riesgo de ejecución de código arbitrario,
mismo tema que H-04/H-05. Candidato a H-25 propio en el análisis, **todavía no registrado
formalmente** ahí. Sin relación con la migración de la tabla — no se tocó.

---

## H-08 (familia `incentivos`) — auditoría técnica hecha, bloqueada en negocio

El plan es explícito: *"Requiere participación de negocio. No es una decisión técnica... Sin este
documento la tarea no arranca."* Se hizo la mitad técnica de la auditoría (`doc/incentivos-auditoria.md`,
commit `b94ad59`) sin tocar ningún código de producción:

- `incentivos3` (4065 LOC): tiene modelo de campaña real (`'2025'|'2026'`), pero el toggle de UI
  está comentado y quedó fijo en `'2026'` — sugiere transición ya cerrada, código viejo sin retirar.
- `incentivos4` (650-827 LOC, **atención al nombre**): el **módulo Angular** es un prototipo sin
  funcionalidad real (datos hardcodeados, cero llamadas HTTP) — pero el **namespace de backend**
  `incentivos4.*` es el motor de cálculo activo que `incentivos3` ya usa. Son cosas distintas que
  comparten nombre por coincidencia.
- `incentivos-a` (1295-2127 LOC): sin concepto de campaña, se diferencia por `tip_cod`. Su backend
  llama al namespace `incentivos2.*` sin renombrar — evidencia fuerte de que es el frontend
  renombrado del viejo `incentivos2`.

**5 preguntas de negocio quedan explícitas al final de `doc/incentivos-auditoria.md`, sin
responder.** No avanzar a tests de caracterización ni tocar código hasta tenerlas.

---

## Roadmap — qué sigue

### Ahora mismo (en curso, interrumpido)

**Tarea 2.6 — H-16 (339 NgModules para 302 componentes), Paso 1: inventariar y clasificar.**
Arrancado esta sesión, sin terminar. Estado real medido con un script mecánico (no committeado
todavía, vive en el scratchpad de la sesión):

- **331 `.module.ts` totales hoy** (el número bajó de 339 por las eliminaciones de Fase 2).
- **142 son de routing** (134 con el sufijo estándar `-routing.module.ts` + 8 con nombres no
  estándar: `editar-routing-cor.module.ts`, `guardar-routing-pm.module.ts`,
  `xxx.routing.module.ts` en `agro-mix-d`/`banca-solidaria`/`cero-cuotas`/`gestion-comercial`).
- **189 no son de routing**, pendientes de clasificar en "de un solo componente" vs. "agrupador
  real". Conteo mecánico preliminar de cuántos componentes declara cada uno (sin verificar a mano
  todavía, puede tener falsos positivos/negativos en el parseo): ~87 con 0 declaraciones (pueden
  ser agregadores legítimos tipo `pre-gestion.module.ts` que solo importan sub-módulos, o wrappers
  como `shared-material.module.ts` — hay que revisar caso por caso), 57 con exactamente 1
  (candidatos directos a "fusionar en el módulo de su dominio", Paso 2 del plan), 35 con 2-4, 10
  con 5+.

**Próximo paso concreto:** terminar de verificar el script de conteo contra un puñado de casos
reales (el conteo automático de `declarations` puede fallar si el patrón del archivo no es
`declarations: [...]` o `declarations: [...component]` con una `const components` separada), y
revisar a mano los ~87 de "0 declaraciones" para separar agregadores legítimos de posibles errores
de detección, antes de escribir la tabla comparativa final que pide el Paso 1.

### Corto plazo (Fase 2, sin bloqueos)

- **Terminar Tarea 2.6 / H-16**: cerrar Paso 1 (clasificación completa), luego Paso 2 (fusionar los
  ~57+ módulos de un solo componente en el módulo de su dominio — mecánico pero con volumen alto),
  Paso 3 (migrar componentes hoja a `standalone: true`, empezando por la librería `stg-*`), Paso 4
  (simplificar routing modules desproporcionados, ej. `rda-administracion-routing.module.ts` con
  726 líneas), Paso 5 (medir: objetivo menos NgModules que componentes).
- **Tarea 2.5 — Kaypacha** (`kaypacha`+`Kaypacha2`+`Kaypacha3`, 3.108 LOC): mismo procedimiento que
  H-08 pero a menor escala. También necesita auditoría con negocio antes de tocar código
  (mismo patrón: perfiles de usuario, generación vigente, fecha de retiro). Buena candidata para
  paralelizar con otra persona, o para preparar su propia auditoría técnica mientras H-08 espera
  respuesta.

### Bloqueado en negocio (no tocar código todavía)

- **Tarea 2.4 — H-08** (`incentivos`): esperar las 5 respuestas de `doc/incentivos-auditoria.md`.

### Después de cerrar Fase 2

- **Fase 3** — Seguridad y deuda técnica: H-04 (gestión de secretos, 7 claves AES en el cliente,
  **requiere decisión conjunta con backend y Seguridad de la información**), H-05 (restablecer
  validación de sesión comentada), H-18 (5 dependencias en fin de vida: `flex-layout`,
  `rxjs-compat`, `tslint`, `protractor`, OAuth Implicit Flow), H-19 (3 librerías de gráficos + 2 de
  mapas redundantes).
- **Fase 4** — Estado y rendimiento: H-14 (servicios de dominio → stores tipados, prerequisito de
  H-20), H-11 (fugas de suscripción), H-20 (activar `OnPush`).
- **Fase 5** — Motor de configuración dinámico: H-24 (tipar `*.util.ts`), H-23 (rutas generadas
  desde el menú del backend en vez de un array estático).
- **Fase X** — Retirar `reportes/legacy/` completo (27.013 LOC, H-09) tras medir telemetría de uso
  real.

**Orden no negociable que fija el plan** (`doc/01-analisis/03-plan-refactorizacion.md:42`): Fase 0
antes que todo · Fase 1 antes de consolidar nada · H-12 antes de H-16 (ya cerrado, no bloquea) ·
H-14 antes de H-20.
