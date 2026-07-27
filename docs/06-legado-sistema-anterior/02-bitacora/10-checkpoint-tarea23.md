# Checkpoint — Tarea 2.3 (H-06), CERRADA por completo

> **Pasos 1 a 5 completos.** Los 22 archivos originales de `stg-table` v1 están migrados a
> `stg-table2` (Paso 4), y `stg-table` v1 + `stg-table3` + `demo-table3` ya están borrados
> (Paso 5, commits `01791cd` y `031196c`). `stg-table.util.ts` sobrevive a propósito (utilidades
> genéricas: `prepareDataForPagination`, `STG_GRID_STYLE`, `STG_INPUT_TABLE_BACKGROUND`, usadas
> por 17 archivos). `npm run build` + suite completa en verde tras cada uno de los ~18 commits de
> toda la tarea (158/158 al cierre).
>
> **Capacidades nuevas que quedan en `stg-table2`** (todas con test de caracterización, ver
> `stg-table2.component.spec.ts`): `onEditCell`, `actions`/`actionTrigger`, `loadingObs`,
> `resolveFormatType` (edición condicional por fila), `globalStyle` con passthrough de
> `height`/`width`, y el escape hatch `type:'raw'` en `DynamicFormatPipe`.
>
> **H-06 queda cerrado.** Ver `doc/04-componentes/stg-table.md` para el detalle completo del
> diseño y la migración. Siguiente en el plan de Fase 2: H-08 (consolidar `incentivos3/4/-a`, la
> tarea más grande, semanas no horas) o H-16 (339 NgModules), según el orden que fija
> `doc/01-analisis/03-plan-refactorizacion.md`.
>
> **Lecciones de esta tanda:** (1) no confiar ciegamente en el inventario de Paso 1 al migrar —
> se encontraron 2 correcciones (`registro-transaccion` sin `actions` real; import muerto de
> `loadingConf` en `client-summary.service.ts`); (2) capacidades "simples" a veces esconden una
> brecha real (`loadingObs` para pickers, `resolveFormatType` para edición condicional por fila)
> — verificar el código real de cada consumidor antes de asumir que el patrón mecánico ya
> validado aplica sin cambios; (3) `sticky:true` por columna es un no-op confirmado en
> `stg-table2` hoy (afecta a ~10+ consumidores ya migrados o preexistentes) — no se implementó
> en esta tarea, queda como hallazgo documentado.

> Sesión 2026-07-25. Continuación de `doc/02-bitacora/09-estado-refactorizacion.md`. Este
> documento existe para retomar sin releer todo el hilo de conversación anterior.

## Qué se hizo en esta sesión

1. **Tarea 2.3, Paso 1 (inventario) — completo.** Se auditaron los **82 consumidores reales**
   de `stg-table`, `stg-table2` y `stg-table3` (vía 5 agentes de exploración en paralelo, batch
   por dominio). Resultado completo en `doc/04-componentes/stg-table.md`.
2. **Tarea 2.3, Paso 2 (diseño de API unificada) — completo.** Documento en
   `doc/04-componentes/stg-table.md`, con la propuesta de `IStgTableHeader`/`StgTableOptions`/
   `StgTableUnifiedComponent`.
3. **Tarea 2.3, Paso 3 (TDD, extender la base) — NO empezado.** Hay una decisión pendiente de
   confirmar antes de arrancarlo (ver abajo).

## La decisión pendiente: base de la tabla unificada

El plan escrito (`doc/01-analisis/03-plan-refactorizacion.md:742-767`) dice que `stg-table3` es
la base correcta por ser la única tipada. El inventario real dice lo contrario:

- `stg-table3`: **1 consumidor real**, y es un demo (`demo-table3`), no una pantalla de negocio.
- `stg-table2`: **60 consumidores reales**, ya trae el sistema de formato más rico
  (`DynamicFormatPipe`: integer/decimal/percent/pbs/trafficlight/truncate/icon/chip/link/custom),
  sort, `cellStyleFn`/`rowStyleFn`, headers anidados.
- `stg-table` v1: **22 consumidores reales**, aporta lo que `stg-table2` no tiene: edición inline
  real (`onEditCell`), acciones con diálogo, iconizer.

**Recomendación documentada:** construir la tabla unificada extendiendo `stg-table2`, portándole
solo `onEditCell` y `actions` de v1 (el iconizer ya lo cubre el pipe existente). `stg-table3` se
retira sin portarle nada — su único consumidor es un demo. Detalle completo, con la tabla de
capacidades por consumidor, en `doc/04-componentes/stg-table.md`.

**Por qué se congela aquí y no se sigue solo:** esto no es un detalle de implementación — es
revertir la premisa arquitectónica que el plan escrito fija para toda la Tarea 2.3 (semanas de
trabajo, eventualmente toca las 82 pantallas). Es la misma clase de corrección que ya pasó en
Tarea 2.2 con H-06 (el análisis original de qué tabla tenía sort estaba invertido), pero de mayor
alcance. Antes de escribir código de producción o tocar cualquiera de los 82 consumidores, hace
falta que el usuario confirme o rechace el pivote.

## Hallazgos colaterales para no perder (fuera de alcance de Tarea 2.3)

Documentados con detalle en la sección "Defectos y código muerto encontrados de paso" de
`doc/04-componentes/stg-table.md`. El más importante:

- 🔴 **`ranking-k/detallek.component.ts` y `ranking-k/principal.component.ts` usan `eval()`
  sobre JSON devuelto por el backend** para construir el `dataSource`. Riesgo de ejecución de
  código arbitrario si la respuesta del backend se manipula — mismo tema que
  [H-04](../01-analisis/02-analisis-refactorizacion.md#h-04)/[H-05](../01-analisis/02-analisis-refactorizacion.md#h-05).
  Candidato a hallazgo propio en el análisis (H-25), no solo una nota al margen.
- Pantallas rotas encontradas de paso (no relacionadas con la tabla, solo se vieron de rebote):
  `rep01-precosechas` (headers nunca asignados, tabla sin columnas), `seguros-pasivos` (5º tab
  referencia propiedades inexistentes en la clase), `pre-ges-sis-responsables` (edición inline
  visual pero `onEditCell` comentado, no persiste).

## Próximo paso concreto al retomar

1. Confirmar con el usuario la base (`stg-table2` vs. seguir el plan al pie de la letra con
   `stg-table3`).
2. Si se confirma `stg-table2`: escribir el test de caracterización de `onEditCell`/`actions`
   contra `pre-linea-simple.component.ts` (el consumidor real más simple que usa ambas
   capacidades) antes de tocar el componente.
3. Decidir si H-25 (el `eval()` de `ranking-k`) se registra formalmente en
   `doc/01-analisis/02-analisis-refactorizacion.md` o se atiende aparte, dado que es un hallazgo
   de seguridad, no de duplicación.

## Estado de tareas de esta sesión (TaskList del harness)

- [x] Paso 1: inventariar consumidores y capacidades (82 archivos, 5 agentes en paralelo)
- [x] Paso 2: diseñar API unificada (`doc/04-componentes/stg-table.md`)
- [ ] Paso 3: extender la base por capacidad (TDD) — bloqueado en la confirmación de arriba
- [x] Este checkpoint
