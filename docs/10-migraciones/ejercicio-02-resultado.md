# Ejercicio 02 — Seguros, Campañas, Comercial Ejecutivo, Proyecciones, Reportes PDM y Movilidad

Resultado de aplicar `promt-01.md` (v2). Se amplió el alcance de
`ejercicio-02.md`: en vez de los 8 reportes del enunciado se migraron **los 17
pendientes**, con lo que `sintaxis.json` queda cubierto al 100 %.

> **Estado global:** `estado-migracion.md` · **Ejercicio anterior:** `ejercicio-01-resultado.md`

## 1. Árbol de carpetas

Seis módulos nuevos bajo `actividad-diaria/components/`:

```
Seguros/
├── seguros.routes.ts
├── services/seguros.service.ts
└── items/{reporte-seguros, seguros-pasivos, evolutivo-pasivos, seguros-optativos}/

Campañas/
├── campanas.routes.ts
├── models/campanas.model.ts          # filtros de Agendamiento
├── services/campanas.service.ts
└── items/{apadrinamiento, mentoring, agendamiento}/

Comercial Ejecutivo/
├── comercial-ejecutivo.routes.ts
├── services/comercial-ejecutivo.service.ts
└── items/{desembolsos, clientes, agro, pdm}/

Proyecciones/
├── proyecciones.routes.ts
├── services/proyecciones.service.ts
└── items/{proyeccion-colocacion, proyeccion-diaria-colocacion}/

Reportes PDM/
├── reportes-pdm.routes.ts
├── services/reportes-pdm.service.ts
└── items/{seguimiento-pdm, banca-solidaria}/

Movilidad/
├── movilidad.routes.ts
├── services/movilidad.service.ts
└── items/{resumen-movilidad-comercial, resumen-movilidad-recuperaciones}/
```

## 2. Mapeo

| Módulo | Reporte | Ruta | `cod_rep` | Motor | Bloques |
|---|---|---|---|---|---|
| Seguros | Reporte Seguros | `leg/…/cam-seguros` | `GRSCMIS` | `regularData` | `_01`,`_02`,`_04`,`_05` |
| Seguros | Seguros Pasivos | `repositorio/…/seguros-pasivos` | `RS_SEG_PAS` | `table.regular` | `_03`,`_01`,`_02`,`_04` |
| Seguros | Evolutivo Pasivos | `repositorio/…/seguro-pasivos-grafico` | `GRAFSEGPAS` | `regularData` (gráfico) | `_01`,`_02` |
| Seguros | Reporte Seguros Optativos | `repositorio/…/seguro-com` | `GRSCMISREP_01` | `table.regular` | único |
| Campañas | Apadrinamiento | `leg/…/cam-apa` | `R_APADRINA_01` | `regularData` | único |
| Campañas | Reporte Mentoring | `leg/…/RMentoring` | `RMENTORIN_01` | `regularData` | único |
| Campañas | Agendamiento | `repositorio/…/agendamiento` | `RS_AGE_COM` | `table.regular` | `_01`×2 modes, `_02`, `_03` |
| Comercial Ejecutivo | Desembolsos | `leg/…/desem-reacfae` | `DESEMBOLSOS_01` | `regularData` | único |
| Comercial Ejecutivo | Clientes | `leg/…/cli` | `Clientes_01` | `regularData` | único |
| Comercial Ejecutivo | Agro | `leg/…/agro` | `AGRO_01` | `regularData` | único |
| Comercial Ejecutivo | PDM | `leg/…/pdm` | `PDM_01` | `regularData` | único |
| Proyecciones | Proyección colocación | `leg/…/proy_M1` | `PROYEC_COLREC` | **`reportData`** | `_01`,`_03` |
| Proyecciones | Proyección diaria | `leg/…/proy_M2` | `PROYEC_DIACOLREC` | `regularData` | `_01`,`_02` |
| Reportes PDM | Seguimiento PDM | `leg/…/seg_pdm` | `SEG_PDM_01` | `regularData` | único |
| Reportes PDM | Banca Solidaria | `repositorio/…/banca-solidaria` | `GRBSOLI_01` | `table.regular` | único |
| Movilidad | Resumen Mov. Comercial | `leg/…/res-mov` | `RESNMOV_01` | `regularData` **paginado** | único |
| Movilidad | Resumen Mov. Recuperaciones | `leg/…/res-mov-rec` | `RESNMOVR_01` | `regularData` | único |

## 3. Decisiones no obvias

- **`PROYEC_COLREC` va por el strand deprecado.** Su `reportType` está
  comentado en `com-map.module.ts`, así que cae en el `DEPRECATED` por defecto
  de `report.ts`. Es la trampa #2 del prompt, encontrada acá por primera vez en
  un reporte real.
- **`res-mov-rec` usa `PARAMS_HIER_FC`, no `PARAMS_HIER_OFICINA`.** Su `jerar`
  es `OFI_3` = `{code:4, max_lvl:1}` ("solo FC"), no el `OFI_1`
  `{code:2, max_lvl:5}` de oficinas. Los nombres se parecen; los códigos no.
- **`res-mov` es paginado.** Host `cra-V10` → `regularPaginado()`, con `pagen` y
  el nodo completo.
- **Los reportes de `repositorio` piden `fec` con guiones.** Sus componentes
  legados mandan `moment(curr_fec).format("YYYY-MM-DD")` bajo la clave `fec`
  — o sea, el nombre del motor mixto pero el formato de `fecha()`.
- **`Movilidad` es un módulo inventado.** Estos dos reportes cuelgan del nodo
  raíz en `sintaxis.json`, sin nodo propio. Se agrupan porque comparten dominio;
  la alternativa era un módulo por reporte.
- **`ClientesEjecutivoComponent` lleva sufijo** para no chocar con el módulo
  `Clientes` de Actividad Diaria: son reportes distintos con el mismo nombre.
- **Seguros Pasivos se devuelve en orden de pantalla, no de llamada.** El
  legado pide `_01`…`_04` pero pinta primero el `_03` (el resumen).
- **`GRSCMIS` y `PROYEC_DIACOLREC` tienen bloques comentados.** Se migran solo
  los activos: 4 y 2 respectivamente, no 5 y 3.

## 4. Shared UI reutilizada

- `<app-reporte-simple>` + `ReporteSimpleBase`/`ReporteBloquesBase` — los 11
  reportes del motor mixto.
- `<app-tabla-dinamica>` — los 4 de `table.regular`, cuyas columnas manda el
  backend.
- `<app-grafico-mixto>` — Evolutivo Pasivos.
- `<app-window-panel>`, `<app-hier-selector>`, `<app-empty-state>`,
  `<app-list-skeleton>`, `<app-select-filtro>` — el resto.

Ningún componente pinta tabla, ventana ni filtro por su cuenta.

## 5. Pendientes declarados

- **Evolutivo Pasivos**: el legado resuelve `series`/`categories` con `eval()`.
  Acá se hace `JSON.parse` en `try/catch`: si el backend emite literales JS en
  vez de JSON, el gráfico queda vacío en lugar de mostrar datos equivocados.
  Falta un payload real para cerrarlo.
- **Seguros Optativos**: falta el selector de periodo (`RS_FECH` →
  `meta1[0].json_result`), por el mismo motivo. Con la fecha de corte del
  usuario el reporte ya funciona.
- **Seguros Pasivos**: la tabla "Protección 360" del template legado no se
  migra porque en el legado tampoco se llena.

## 6. Verificación

| Check | Resultado |
|---|---|
| `tsc --noEmit` app + spec | limpio |
| `ng build --configuration production` | sin errores ni warnings |
| `ng test --watch=false` | 1214 / 1214 |
| `e2e/actividad-diaria-lote-02.spec.ts` | 17 / 17 |
| Auditoría `sintaxis.json` | 24 migrados · 0 pendientes · 111 rutas en la app |
