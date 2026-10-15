# MOD-0002 · Análisis

## 1. Cómo funciona hoy

`mod_rep.rep.RTABCUERES01` ([copia extraída](../../extraccion/procedimientos/mod_rep/rep/RTABCUERES01.sql),
modificado en la base el 2026-09-23) recibe `@fecha`, `@tip_cod` y `@cod_rel`, pero **no usa ninguno**:

| Qué | Hoy | Efecto en pantalla |
|---|---|---|
| Periodo | `WFECPRO = '2026-06-30'` fijo | elegir otro mes en el filtro no cambia las cifras |
| Lista de periodos | escrita a mano: junio a enero 2026 | no aparecen meses nuevos ni anteriores |
| Preliminar | siempre `1` | todo mes se titula "Preliminar" |
| Nivel | `WCODREL = 1` fijo (FC) | elegir un territorio, unidad, etc. muestra siempre FC |
| `variacion_acumulado_pct` | `0` | la columna "% " sale en 0 % |
| Orden de las filas | sin `ORDER BY` | depende del plan de ejecución; el desplegable del front supone el orden de `REVARPYG.pos` |

Devuelve dos resultados: la cabecera (`dummy`, un JSON con `preliminar` y `fechas`) y una fila por cuenta de
`REVARPYG` con los valores de `WREPPYG001`. El front (MIS-angular-front, `actividad-mensual/utils/cuenta-resultados.util.ts`)
lee exactamente esas columnas; el diseño de la imagen ya está implementado ahí.

## 2. Qué cambia en el SP nuevo

| # | Cambio | Cómo |
|---|---|---|
| 1 | Periodo | `'NOW'` → último `WFECPRO`; si no, el mes de `@fecha` (el front manda el día 1, `WFECPRO` es el cierre). Mes sin datos → último, igual que el front con `NOW`. |
| 2 | Cabecera | `fechas` = todos los meses de `WREPPYG001` (más reciente primero, formato `YYYY-MM-01`); `preliminar` = 1 solo si el mes mostrado es el último cargado; nuevo `productos` con la lista para un futuro filtro (el front actual ignora claves que no conoce). |
| 3 | Jerarquía | `tip_cod = 7` → nivel 1 (FC). Cualquier otro nodo (20 territorio, 19 corredor, 21 grupo, 18 unidad, 17 coordinador, 1 o 2 asesor) → **suma de sus asesores** en el nivel 3, con `storage.ref.WJERCOR03` vigente (`RINDFEC = 'actual'`, último `RFECPRO`), el mismo patrón que `RRANKM02` o `RSRTOPMIS001`. La instancia verificada expone códigos alfanuméricos como `ASESO272` en `WCODSEC` para `WCODREL` 3 y 5; el paso 1b confirma su correspondencia con `WJERCOR03.RCODSEC`. |
| 4 | Producto | Parámetro nuevo `@producto` (por defecto `'TODOS'`): nivel 4 en FC y nivel 5 (asesor y producto) por debajo, con `RDESPROD` por `RETP002/001/003`. |
| 5 | `variacion_acumulado_pct` | `(WACUMACT − WACUMAA) / WACUMAA`, como **fracción**: el front usa `formatPercent`, que multiplica por 100 (0.1291 → "12.91 %"). La fórmula "× 100" de la observación mostraría 1291 %. Signo como en la imagen: *Resto de ingresos* −2 790 vs −2 267 → +23.08 %. |
| 6 | Columnas nuevas | `variacion_periodo_anio_anterior` (`WVALACT − WVALAA`) y su `%`, las fórmulas de la observación para el mes. Van al final; el front actual no las muestra. |
| 7 | Orden | `ORDER BY REVARPYG.pos`. |

Se mantienen las columnas base del reporte, el nombre `dummy` de la cabecera y los parámetros del catálogo
(`@producto` tiene valor por defecto). Se omiten `trimestre_1`–`trimestre_4` y `total_anio`: la estructura
consultada de `WREPPYG001` no contiene `WACUMT1`–`WACUMT4`, por lo que no se pueden calcular con esa fuente.
Esto cambia el contrato de salida respecto del SP original; confirmar el consumo en el front antes de activar.

## 3. Cómo se comprobó contra la imagen

| Columna de la imagen | Columna del SP | Ingresos financieros (imagen) |
|---|---|---|
| Jun.25 | `periodo_anio_anterior` (`WVALAA`) | 48 747 |
| May.26 | `periodo_anterior` (`WVALANT`) | 56 743 |
| Preliminar Jun.26 | `periodo_actual` (`WVALACT`) | 56 068 |
| Jun.26 vs May.26 | `variacion_periodo_anterior` | 56 068 − 56 743 = −675 ✔ |
| 2025 / 2026 | `acumulado_anio_anterior` / `acumulado_actual` | 289 299 / 326 650 |
| Jun.26 vs Jun.25 | `variacion_acumulado` | 37 351 ✔ |
| Jun.26 vs Jun.25 % | `variacion_acumulado_pct` | 0.1291 → 12.91 % ✔ (Resultados: 29 648 / 18 707 = 158.48 % ✔) |

## 4. Supuestos que confirma el paso 1 de `04-verificacion.sql`

| # | Supuesto | Si no se cumple |
|---|---|---|
| S1 | En los niveles 3 y 5, `WCODSEC` corresponde al código alfanumérico del asesor (`WJERCOR03.RCODSEC`), y la jerarquía envía `tip_cod = 1` o `2` para asesor. | Si el paso 1b no encuentra coincidencias suficientes, no activar el SP: confirmar el significado del campo y ajustar el mapeo jerárquico. El SP acepta ambos códigos de tipo para el nivel asesor. |
| S2 | Las cuentas de `REVARPYG` son importes que se pueden sumar entre asesores (márgenes incluidos). | Paso 1e muestra ratios o coeficientes: esas filas se calculan aparte. |
| S3 | "Preliminar" = el último mes cargado. | Si el cierre se marca en otro lado, indicarlo y se lee de ahí. |
| S4 | La suma de asesores puede no llegar al total FC (importes sin asesor). | Paso 1c muestra la diferencia; FC usa el nivel 1, así que FC siempre cuadra con lo que se ve hoy. |
| S5 | Los importes están en miles, como titula el front. | Paso 1d: si salen en soles, se divide por 1000 en el SP o se cambia el título. |
| S6 | Jerarquía vigente, como la del selector del front: un asesor que cambió de unidad suma en la nueva aun para meses pasados. | Si se quiere la jerarquía de cada mes, se usa el `RFECPRO` del periodo. |

La instancia consultada no tiene `WACUMT1`–`WACUMT4` en `WREPPYG001`. Por pedido, el SP nuevo no devuelve
las columnas trimestrales ni `total_anio` hasta identificar una fuente válida para esos importes.

## 5. Qué falta fuera del SP

- **Periodo y jerarquía**: nada. El front ya los manda; con `06-activacion.sql` empiezan a filtrar.
- **Producto** (pendiente, no incluido): para que la persona usuaria lo elija hace falta
  1. agregar `{"order":4,"name":"producto"}` a `RTPREP.params` de `TAB_CUE_RES_01`, y
  2. en el front, un selector con `headers.productos` que mande `producto` en `cuentaResultados()`.
  Hasta entonces el SP usa `'TODOS'` y el reporte se ve como hoy, filtrado por periodo y jerarquía.
- **Nivel de operación**: sin definir en la reunión del 2026-10-07; no se incluye.

## 6. Pasos

1. `04-verificacion.sql` **paso 1**: confirmar S1 a S6. Si alguno falla, avisar antes de seguir.
2. Ejecutar `03-RTABCUERES01_NEW.create.sql`.
3. `04-verificacion.sql` **paso 2**: en FC y último mes, mismos importes que el original (más el % y el orden).
4. `04-verificacion.sql` **paso 3**: otro mes, una unidad, un territorio y un producto.
5. `06-activacion.sql`: apuntar `TAB_CUE_RES_01` al nuevo y hacer `COMMIT`.
6. Revisar en el front: cambiar periodo y nivel de jerarquía; las cifras deben cambiar.
7. Extraer el SP nuevo (`python extraccion/herramientas/bd.py extraer --sp RTABCUERES01_NEW`), reexportar
   `extraccion/fuente/reportes.json` y `npm run generar`. Marcar esta modificación como *aplicada*.

Para volver atrás: `05-rollback.sql`.
