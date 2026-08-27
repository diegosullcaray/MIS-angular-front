# Estado de las incidencias actualizadas

Resumen de las ocho tareas de `incidencias-mora-actualizado.md` (M1–M5) y
`incidencias-carteras-actualizado.md` (C1–C3).

**Todas resueltas.** 1 314 tests en verde (197 archivos), `tsc` limpio y build de
producción sin errores.

| # | Reporte | Estado | Commit |
|---|---------|--------|--------|
| M1 | Monitor IMR | ✅ | `c1430aa` |
| M2 | Monitor de Efectividades | ✅ | `c1430aa` |
| M3 | Seguimiento Reprogramados | ✅ | `c1430aa` |
| M4 | Seguimiento de Portafolio | ✅ | `c1430aa` |
| M5 | Colocación de Seguro Optativo | ✅ | `07a6840` |
| C1 | Monitor Salidas y Retenciones | ✅ | `89a202a` |
| C2 | Gestión Comercial | ✅ | `07a6840` |
| C3 | Rank Comercial | ✅ | `89a202a` |

---

## M1 · Monitor IMR — diálogos indebidos en las tarjetas KPI

**Reportado:** al hacer clic en las tarjetas de KPI se abrían modales que el
legado no abre.

**Causa:** las tarjetas se habían migrado como `<button>` con `(click)`. En el
legado son texto: el único elemento clicable del reporte es la TABLA, y solo en
tres casos concretos.

**Corrección:** las tarjetas pasan a ser `<div>`, sin `(click)` ni subrayado. El
clic vive donde el legado lo pone, en `onCelda()`, con sus tres ramas:
`desc` → drill-down de jerarquía, `sali2`/`sali3` → diálogo de detalle, y
cualquier otra columna → nada. Las filas con `style === 1` (subtotales) no
responden al clic.

**Archivos:** `Cartera en Mora/items/monitor-imr/`.

---

## M2 · Monitor de Efectividades — HTTP 500, pestañas y filtros

**Reportado:** el reporte no cargaba (error 500 en `reporte-bloques.base.ts:56`),
faltaban las pestañas y el panel de filtros del detalle.

**Causa (el 500):** se pedía por el strand equivocado. **El strand lo decide el
HOST, no el mapa**: el `reportType` de `cra-map.ts` solo lo miran los hosts que
llaman `getMixData()`. Los hosts `-v4`, `-v7` y `-v11` llaman
`cs.getRegularData()` directamente y arman sus parámetros como
`{ ...getParamsAdd(), ...filter, ...level }`, **sin `fec`**. Este reporte es del
grupo `-v4`.

**Corrección:**

- `BloqueReporteService.regularExacto()` — `regularData` con exactamente los
  parámetros del mapa, sin el `fec` que agrega `regular()`.
- `regularTolerante()` — el backend contesta 500
  (`NullPointerException: Resultado vacio para: regularData`) cuando un bloque no
  devuelve filas; dentro de un `forkJoin` eso tumbaba el reporte entero. Ahora el
  bloque vacío queda como tabla vacía y los otros se pintan igual.
- Dos pestañas con `p-tabs` ("Monitor de Efectividades" y "Detalle de
  Efectividades"), en el orden del legado.
- Los diez filtros del detalle, todos con "TODO" por defecto. Las opciones de
  "Última Gestión" NO están en duro: salen del backend (`SEL_EFEC_01`).
- El detalle va paginado: `pagen` se pone DESPUÉS de los filtros, porque
  `paramsDetalleComunes()` trae el suyo fijo en 1 y si quedara último pisaría la
  página que se está pidiendo.

---

## M3 y M4 · Seguimiento Reprogramados y Seguimiento de Portafolio — timeouts

**Reportado:** la tabla no termina de renderizar / la petición lanza 500.

**Causa:** los dos mueven tanta data que no entran en los 30 s del timeout global
del interceptor.

**Corrección:** timeout POR REQUEST vía `HttpContext` (`TIMEOUT_MS`), no un
global más alto. Subir el global dejaría a toda la app esperando el doble ante
cualquier petición realmente colgada; así solo esperan de más los dos reportes
que lo piden (`TIMEOUT_REPORTE_PESADO_MS`, 120 s). Va en
`BloqueReporteService.regularLento()`, que además tolera el bloque vacío.

---

## M5 · Colocación de Seguro Optativo — filtros, KPIs y diseño

**Reportado:** faltan los filtros de fecha, faltan KPIs dinámicos, el diseño es
deficiente.

**Filtro de fecha.** El legado NO usa un calendario libre: usa un desplegable con
los cortes que declara el backend (`RS_FECH` → `meta1[0].json_result`, con la
forma `{ label, val }`). Se migró tal cual, con `<app-select-filtro>`: un
`p-datepicker` dejaría elegir fechas para las que no hay datos. El valor elegido
reemplaza al corte del usuario en la consulta; si el bloque no responde o el
payload es ilegible, la lista queda vacía y el reporte usa el corte del usuario
—igual que el legado (`catch` → `filter1 = []`).

**KPIs.** Ya se mapeaban dinámicamente desde la fila total de `GRSCMISREP_01`
(no hay datos en duro). Se endureció la penetración global: el propio legado deja
anotada la duda de si llega como fracción o como `"76.95%"`; ahora se aceptan las
dos (con `%` se entiende que son puntos porcentuales y se divide entre 100).

**Diseño.** Tarjetas con barra de acento, chip de ícono, sombra y jerarquía
tipográfica; las seis mini-tarjetas por tipo de seguro llevan además una barra
proporcional al producto más colocado, para ver de un vistazo cuál pesa más.

---

## C1 · Monitor Salidas y Retenciones — indicador de estado

**Reportado:** falta el punto de color en las filas de la tabla.

**Causa:** el churn rate se pintaba con un color plano; el legado usa un semáforo
de tres cortes sobre el mismo valor.

**Corrección:** `semaforoChurn()` con los umbrales del legado (`< 0.9025` rojo,
`< 0.95` ámbar, resto verde) y `conSemaforoChurn()`, que agrega la clave `ret_tl`
que `<app-tabla-dinamica>` ya sabe leer para dibujar el punto. Así el indicador
usa el mismo mecanismo que el resto del sistema en vez de un color aparte.

---

## C2 · Gestión Comercial — filtro de fecha, KPIs y gráficos

**Gráficos.** Los siete salían en blanco. Estos bloques NO traen su
`{categories, series}` en `headers` como el resto del sistema: el legado lo busca
primero en `data[0]`, en el PRIMER campo de la fila (su nombre cambia según el
bloque), y solo cae a `headers` si `data` viene vacío. Leer únicamente `headers`
era la causa. Un payload ilegible deja ese gráfico vacío sin tumbar a los otros
seis.

Además, dos ajustes de forma para que reproduzcan lo que el legado dibuja:

- "Desembolsos Diarios": la TAPP se pasa a porcentaje (×100) y va como línea
  sobre el eje secundario.
- "Saldo Cartera Vigente" y "Variación Cliente Stock" mezclan un NIVEL con su
  VARIACIÓN, de órdenes de magnitud distintos. Se agregó
  `SerieGrafico.secundaria` a la fábrica compartida para mandar el nivel al eje
  secundario; con un solo eje la variación queda aplastada contra el cero.

**KPIs.** Se mapean las diez tarjetas del encabezado desde la fila total de
`RS_GEST_COM_01`, con sus métricas secundarias (TMM, %Cumpl., metas, distancias)
y sus barras de avance. "Cancelación Vig." no la manda el backend: el legado la
despeja de `desembolsos − var. saldo vigente − rodamiento`.

El semáforo de cumplimiento usa los cortes 100 %/80 % del legado. **Diferencia
deliberada:** `obtenerClaseColor()` vuelve a multiplicar por 100 adentro, así que
los cumplimientos que ya venían en porcentaje siempre le salían verdes; acá el
helper recibe siempre el porcentaje y compara contra 100/80, que es lo que la
pantalla quiere decir.

**Filtro de fecha.** Mismo mecanismo que M5, con `RS_FECH02` en vez de `RS_FECH`.
La fecha elegida viaja a las tres tablas y a los siete gráficos.

---

## C3 · Rank Comercial — filtros propios y "Avance Esperado"

**Reportado:** el componente cuelga del filtro global; falta el indicador de
"Avance Esperado (Timing)".

**Causa:** se había migrado con `<app-hier-selector>`. El legado pide el ranking
COMPLETO (`territorio: '0'`, `corredor: '0'` en duro) y filtra en el cliente con
sus tres filtros propios (unidad, corredor, territorio).

**Corrección:** se quitó el selector de jerarquía, el service dejó de recibir
nodo y la carga pasó al constructor. Se agregó el indicador "Avance Esperado"
—el `Timing` de la primera fila, el porcentaje de días transcurridos del mes— y
la leyenda del semáforo, que es la referencia contra la que se pinta cada
columna de avance.

---

## Tests

47 tests de regresión nuevos, en cinco archivos:

| Archivo | Cubre |
|---------|-------|
| `services/bloque-reporte.periodos.spec.ts` | El selector de periodo compartido (M5, C2) |
| `Cartera/models/gestion-comercial.model.spec.ts` | Los diez KPIs y el semáforo (C2) |
| `Cartera/services/cartera-repositorio.service.spec.ts` | Payload de gráficos, KPIs y periodo (C2, C3) |
| `Seguros/services/seguros.service.spec.ts` | `RS_FECH` y el corte elegido (M5) |
| `Seguros/models/seguros.model.spec.ts` | Penetración global en sus dos unidades (M5) |
| `shared/ui/graficos/utils/highcharts-factory.util.spec.ts` | El eje secundario (C2) |

**No son tests de humo.** Cada uno se validó reintroduciendo el bug que cubre y
comprobando que falla exactamente él:

| Bug reintroducido | Tests que fallan |
|-------------------|------------------|
| Los gráficos se leen solo de `headers` | 4 |
| Los KPIs no salen de la fila total | 1 |
| La fecha del selector se ignora (C2) | 1 |
| El periodo elegido no llega al reporte (M5) | 1 |
| El selector lee de `data` en vez de `meta1` | 4 |
| La fábrica ignora `secundaria` | 2 |

---

## Notas de migración

Dos cosas que valen para el resto de la migración y quedaron documentadas en
`docs/10-migraciones/promt-01.md`:

1. **El strand lo decide el host, no el mapa.** Los hosts `-v4`, `-v7` y `-v11`
   llaman `getRegularData()` directamente e ignoran el `reportType` de
   `cra-map.ts`. Pedirles el strand del mapa da HTTP 500.
2. **"Filtro de fecha" casi nunca es un calendario.** En los reportes del
   repositorio es un desplegable de cortes que sirve el backend (`RS_FECH` /
   `RS_FECH02`). Vale la pena revisarlo antes de poner un `p-datepicker`.
