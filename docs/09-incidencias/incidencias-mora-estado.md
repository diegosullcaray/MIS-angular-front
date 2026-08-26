# Estado de las incidencias — `incidencias-mora.md`

8 incidencias reportadas, **8 corregidas**. Ninguna quedó sin resolver.

| # | Reporte | Incidencia | Estado |
|---|---|---|---|
| 1 | Monitor IMR | Abre diálogos que no corresponden | ✅ Corregido |
| 2 | Monitor Efectividades | No carga — HTTP 500 | ✅ Corregido |
| 3 | Seguimiento Reprogramados | No carga la tabla | ✅ Corregido |
| 4 | Reporte de Pago Puntual | No carga la tabla | ✅ Corregido |
| 5 | Seguimiento de Portafolio | HTTP 500 | ✅ Corregido |
| 6 | Evolutivo Pasivos | Filtros distintos al legado | ✅ Corregido |
| 7 | Seguros Pasivos | Falta la distribución por pestañas | ✅ Corregido |
| 8 | Seguros Optativos | Faltan los KPIs y "Rendimiento por Tipo" | ✅ Corregido |

---

## La causa raíz de 2, 3, 4 y 5: el strand lo decide el HOST, no el mapa

Cuatro de las ocho incidencias son el mismo error mío, y vale la pena dejarlo
escrito porque contradice lo que yo mismo había documentado en el prompt.

Yo había asumido que el strand sale del `reportType` de `cra-map.ts` /
`com-map.module.ts`, y que una entrada sin `reportType` (o con él comentado)
cae en el `ReportType.DEPRECATED` por defecto de `report.ts` → `reportData`.

**Eso solo vale para los hosts que llaman `getMixData()`.** Revisando los ocho
hosts que usa Actividad Diaria:

| Host | Cómo pide los datos | ¿Respeta el `reportType` del mapa? |
|---|---|---|
| `cra-v1p1`, `-v1p6`, `-v6`, `-V10` | `cs.getMixData(report, reportType, params)` | Sí |
| `cra-v1p7` | `getMixData` para su tabla principal | Sí |
| **`cra-v4`, `-v7`, `-v11`** | **`cs.getRegularData(report, params)`** | **No — siempre `regularData`** |

Los tres monitores de efectividades cuelgan de `-v4`/`-v7` y yo los pedía por
`reportData`: de ahí el 500 y las tablas vacías.

Segundo detalle del mismo grupo: esos hosts arman los parámetros como
`{ ...confT.getParamsAdd(), ...filter, ...level }` — los del bloque, los
filtros y `tip_cod`/`cod_rel`, **y nada más**. No agregan `fec`. Nuestro
`BloqueReporteService.regular()` sí lo inyecta siempre, y ese `fec` de más
sobre un bloque que ya declara su corte como `fecha` es lo que rompía
`ava-port`.

### Qué se cambió

- **`BloqueReporteService.regularExacto()`** (nuevo): pide por `regularData`
  con exactamente `{tip_cod, cod_rel, ...extra}`, sin `fec` automático.
  Replica lo que hacen `-v4`, `-v7` y `-v11`.
- `RS_MON_EFEC`, `RS_MON_EFECREPRO`, `RS_MON_EFECTRAMOSC` y `RS_AVA_POR` pasan
  a `regularExacto()`.
- **`PROYEC_COLREC` también** (host `-v11`), aunque no estaba reportado: tenía
  exactamente el mismo defecto y habría fallado igual.

---

## 1 · Monitor IMR — diálogos que no corresponden

El legado (`ddEvent()` de `principal.component.ts`) hace **tres cosas distintas
según la columna** que se toca:

| Columna | Acción del legado |
|---|---|
| `desc` | `ddHier(row)` — baja un nivel en la jerarquía, no abre nada |
| `sali2`, `sali3` | Abre el listado de clientes de esa fila |
| cualquier otra | Nada |

En los tres casos descarta las filas de total (`style === 1`), y el drill-down
además corta en `tip_cod === 1` (Financiera).

Mi versión abría el diálogo al hacer clic en **cualquier** celda de cualquier
fila, porque `<app-tabla-dinamica>` solo emitía la fila entera.

**Corrección:** se le agregaron al componente compartido dos entradas nuevas,
`columnasClicables` y `celdaSeleccionada`, que son el equivalente del
`onClickCell` de `stg-table2` del legado. Con eso Monitor IMR distingue la
columna y reproduce las tres ramas. Es compatible hacia atrás: sin
`columnasClicables` la tabla sigue emitiendo `filaSeleccionada` como antes, así
que ningún otro reporte cambia.

---

## 6 · Evolutivo Pasivos — filtros distintos

No era un filtro de más ni de menos: era **otra jerarquía**. El legado la pide
con `iniHierarchy(14, 4)`, mientras que el resto de los reportes de repositorio
usan `(9, 6)`. Yo había puesto `PARAMS_HIER_UNIDAD`, que es justamente `(9, 6)`.

La jerarquía 14 no tiene nombre simbólico en `getHierarchyConfig()` del legado
(no es ningún `UNI_*` ni `OFI_*`), así que se agregó
`PARAMS_HIER_SEGUROS_PASIVOS` a `jerarquia.model.ts` con esos valores y el
comentario de dónde salen.

---

## 7 · Seguros Pasivos — pestañas

El legado usa un `mat-tab-group` con cinco pestañas; yo las había apilado como
cinco secciones seguidas. Ahora son pestañas (`<p-tabs>`), en el mismo orden:

1. Seguro Pasivo Resumen (`RS_SEG_PAS_03`)
2. Seguros Oncológicos (`_01`)
3. Vida Segura (`_02`)
4. Protección Total (`_04`)
5. Protección 360 — **vacía**

La quinta se deja aunque no traiga datos: el template del legado la declara con
`dataSource5`/`headerDefs5`, pero esas dos variables **no existen** en su
componente, así que allá también sale vacía. Se mantiene la pestaña para no
cambiarle la navegación al reporte.

---

## 8 · Seguros Optativos — KPIs y "Rendimiento por Tipo"

Faltaban porque yo asumí que serían un bloque aparte y no lo eran: el legado los
calcula desde la **primera fila de la misma tabla** (`kpiTotales ← dataSource[0]`).

Se agregaron los tres KPIs de cabecera y las seis mini-tarjetas:

| KPI | Clave de la fila total |
|---|---|
| Total Operaciones | `TOpeOS` |
| Total Seguros (Colocados) | `TSegOS` |
| Penetración Global | `PorcPenOS` |
| Multiriesgo · Vida Segura · Agropecuario · Prot. Cuota · Oncológico · Prot. Total | `SegMR` · `SegMC` · `SegAgro` · `SegPC` · `SegOnco` · `SPCCOS` |

Los valores se pintan completos (`30,994`), no abreviados: por eso no se usó
`<app-kpi-tile>`, que los mostraría como `31 K` y no coincidiría con el legado.

---

## Sigue pendiente (declarado, no olvidado)

Lo mismo que ya estaba en `estado-migracion.md`; ninguna incidencia lo tocó:

- **Seguros Optativos**: el selector de periodo (`RS_FECH` →
  `meta1[0].json_result`). Falta ver un payload real para saber su forma.
- **Evolutivo Pasivos**: verificar el parseo de `series`/`categories`. El legado
  usa `eval()`; acá va `JSON.parse` en `try/catch`, que deja el gráfico vacío
  antes que mostrar datos equivocados.
- **Dashboard en Revisión** (Cartera en Mora): la cabecera "Avance Comercial" y
  los mapas de calor.

## Lección incorporada al prompt

`promt-01.md` decía que el strand sale del `reportType` del mapa. Es verdad a
medias y por eso rompió cuatro reportes: **el strand lo decide el host**. La
trampa quedó reescrita en el prompt con la tabla de los ocho hosts.
