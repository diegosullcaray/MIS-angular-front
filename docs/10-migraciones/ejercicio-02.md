# Ejercicio 02 — Comercial Ejecutivo, Reportes PDM y movilidad

> Formato revisado después del ejercicio 01. El enunciado ahora trae el mapeo ya
> resuelto: en el 01 se perdió tiempo redescubriendo a mano de dónde salía cada
> `cod_rep`, y ese trabajo es mecánico y verificable, así que va en el enunciado
> y no en la cabeza de quien migra. Ver "Qué cambió" al final.

Aplicá `promt-01.md` sobre este enunciado.

## Alcance — 8 reportes, 3 módulos nuevos

Salen de `sintaxis.json`, nodos `N_REP_EJ`, `N_REP_PDM` y los dos reportes
sueltos del nodo raíz. Es el lote 1 y 2 del orden sugerido en
`estado-migracion.md`.

### Módulo 1 · `Comercial Ejecutivo` (id `N_REP_EJ`)

Los cuatro son bloque único, `cra-v1p1`, `regularData`, jerarquía `UNI_1`, sin
filtros propios: encajan tal cual en `ReporteSimpleBase`. Cambia solo el
`cod_rep` y el título.

| # | Componente | Ruta destino | `cod_rep` | Título del legado |
|---|---|---|---|---|
| 1 | Desembolsos | `leg/com/rda/adm/desem-reacfae` | `DESEMBOLSOS_01` | DESEMBOLSOS SIN FAE NI REACTIVA |
| 2 | Clientes | `leg/com/rda/adm/cli` | `Clientes_01` | Clientes |
| 3 | Agro | `leg/com/rda/adm/agro` | `AGRO_01` | AGRO |
| 4 | PDM | `leg/com/rda/adm/pdm` | `PDM_01` | PDM |

> Ojo con el nombre del componente de "Clientes": ya existe un módulo `Clientes`
> en `actividad-diaria/components/`. Este es otro reporte, del nodo Comercial
> Ejecutivo. Desambiguá la clase (no puede haber dos `ClientesComponent`).

### Módulo 2 · `Reportes PDM` (id `N_REP_PDM`)

| # | Componente | Ruta destino | Origen | Detalle |
|---|---|---|---|---|
| 5 | Seguimiento PDM | `leg/com/rda/adm/seg_pdm` | `SEG_PDM_01`, `cra-v1p1`, `UNI_1`, `regularData` | bloque único |
| 6 | Gestión de Banca Solidaria | `repositorio/actividad-diaria/cartera/banca-solidaria` | `docs/07-modulos/reportes/repositorio/banca-solidaria/` | componente propio: leelo antes de decidir la forma |

### Módulo 3 · reportes sueltos del nodo raíz

Estos dos no cuelgan de ningún nodo en el JSON. Decidí dónde ubicarlos y
justificá la decisión (un módulo `Movilidad` propio es lo más probable, dado que
comparten dominio pero no host ni jerarquía).

| # | Componente | Ruta destino | `cod_rep` | Particularidad |
|---|---|---|---|---|
| 7 | Resumen Movilidad Comercial | `leg/com/rda/adm/res-mov` | `RESNMOV_01` | host **`cra-V10` paginado** → `regularPaginado()`, necesita `pagen` y el nodo completo |
| 8 | Resumen Movilidad Recuperaciones | `leg/com/rda/adm/res-mov-rec` | `RESNMOVR_01` | jerarquía **`OFI_3`**, no `UNI_1` → `PARAMS_HIER_FC` |

## Los dos casos nuevos de este lote

El ejercicio 01 no tocó ninguno de estos dos; son la razón de que este lote vaya
antes que Campañas o Seguros:

1. **Host paginado** (`res-mov`). Ya hay precedente en el repo:
   `CarteraCraService.detalleIncentivosPdm()` y
   `CarteraMoraCraService.efectividadesSinAsignar()`. Sin `pagen` y sin el nodo
   completo el backend responde "Resultado vacio para: regularData".
2. **Jerarquía distinta de `UNI_1`** (`res-mov-rec` usa `OFI_3`). Acá hay una
   trampa de nombres: `OFI_3` **no** es `PARAMS_HIER_OFICINA`. Según
   `mod-rep.service.ts` del legado, `OFI_1` es `{code:2, max_lvl:5}` y `OFI_3`
   es `{code:4, max_lvl:1}` ("solo FC"). La constante que corresponde en el repo
   es **`PARAMS_HIER_FC`**, que ya existe en `models/jerarquia.model.ts` y está
   documentada justamente como `OFI_3`.

## Criterios de aceptación

- Los 8 reportes resuelven en su ruta y muestran su título.
- Ningún componente pinta tabla, ventana ni filtro por su cuenta.
- `tsc` (app + spec) limpio, build de producción sin errores ni warnings,
  `ng test` sin regresiones.
- Smoke e2e nuevo con una fila por ruta, verificando título **y** `page.url()`.
- `ejercicio-02-resultado.md` con la tabla de mapeo y las decisiones no obvias.
- `estado-migracion.md` actualizado.

## Qué cambió respecto del ejercicio 01

| Cambio | Motivo |
|---|---|
| El enunciado trae `cod_rep`, host, jerarquía, strand y bloques ya resueltos | En el 01 eso se dedujo a mano leyendo `cra-map.ts`; es trabajo mecánico y verificable que no aporta al ejercicio |
| Se avisan por adelantado las particularidades (paginado, `OFI_3`, nombre repetido) | En el 01 aparecieron a mitad de camino y obligaron a rehacer |
| Formato tabla en vez de bloques `{ }` anidados | El del 01 era ambiguo: tenía llaves sin cerrar, dos items con el mismo nombre y sangría inconsistente |
| Se explicita el alcance en número de reportes y módulos | Para poder estimar antes de empezar |
| Se listan los criterios de aceptación | En el 01 la verificación quedó a criterio de quien migraba |
