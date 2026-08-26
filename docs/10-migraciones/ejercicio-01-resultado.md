# Ejercicio 01 — Migración de "Cartera en Mora"

Resultado de aplicar `promt-01.md` sobre `ejercicico-01.md`.

## 1. Árbol de carpetas

Se respeta el formato pedido (`components/`, `items/`, `models/`, `services/`,
`[nombre-modulo].routes.ts`) y la convención que ya usan los módulos hermanos de
`actividad-diaria/components/` (`Captaciones`, `Cartera`, `Clientes`,
`Portafolio Reasignado`): carpeta con mayúscula y espacios, rutas en kebab-case.

```
actividad-diaria/components/Cartera en Mora/
├── cartera-en-mora.routes.ts                    # 17 rutas lazy, standalone
├── models/
│   └── cartera-en-mora.model.ts                 # catálogos de filtro + contrato de Monitor IMR
├── services/
│   ├── cartera-mora-cra.service.ts              # los 11 reportes de cra-map/com-map
│   ├── cero-cuotas-nuevas.service.ts            # los 5 de Cero Cuotas Nuevas
│   └── monitor-imr.service.ts                   # backend rep2 (puerto 6304)
├── components/
│   └── Cero Cuotas Nuevas/
│       └── items/
│           ├── dashboard/                       # leg/com/rda/adm/graf-dashboard
│           ├── dashboard-revision/              # repositorio/actividad-diaria/mora/cero-cuotas
│           ├── cuadro-mando/                    # leg/com/rda/adm/cmd-cerocuotanueva
│           ├── top/                             # leg/com/rda/adm/Top-CeroCuota
│           └── base-gestion/                    # leg/com/rda/adm/list-cero-cuotas
└── items/
    ├── cmg-cartera-mora/                        # leg/com/rda/adm/cmg-mora
    ├── cmg-cartera-mora-sin-impulso/            # leg/com/rda/adm/cmg-mora-simp
    ├── calidad-cartera/                         # leg/com/rda/adm/cal-cart
    ├── portafolios-supervision/                 # leg/com/rda/adm/port-sup
    ├── cero-una-cuota/                          # leg/com/rda/adm/zu-cuo
    ├── monitor-imr/                             # repositorio/actividad-diaria/cartera/mon-imr
    ├── monitor-efectividades/                   # leg/com/rda/adm/mon-efec
    ├── seguimiento-reprogramados/               # leg/com/rda/adm/mon-efecrepro
    ├── efectividades-sin-asignar/               # leg/com/rda/adm/mon-efec-sinasig
    ├── top-variables-riesgo/                    # leg/com/rda/adm/top-efec
    ├── reporte-pago-puntual/                    # leg/com/rda/adm/mon-efectramoscomer
    └── seguimiento-portafolio/                  # leg/com/rda/adm/ava-port
```

## 2. Mapeo legado → destino

Cada `cod_rep` sale de `cra-map.ts` (o `com-map.module.ts`) y cada host, del
`rda-administracion-routing.module.ts`.

### items/

| Componente | Ruta legado | `cod_rep` | Host | Strand |
|---|---|---|---|---|
| CMG Cartera en Mora | `cmg-mora` | `cuadro_Variable_Riesgo_01` | `cra-v1p1` | `regularData` |
| CMG Cartera en Mora Sin Impulso | `cmg-mora-simp` | `cmg_mora_simp_01` | `cra-v1p1` | `regularData` |
| Calidad de Cartera | `cal-cart` | `RS_CAL_CAR_01`, `_02` | `cra-v1p1` | `regularData` |
| Portafolios y Supervisión | `port-sup` | `PORTSUPE_01`, `_02` | `cra-v1p1` | `regularData` |
| Cero y una Cuota | `zu-cuo` | `CEROYCUOTA_01`, `_02` | `cra-v1p1` | `regularData` |
| Monitor IMR | `repositorio/mon-imr` | `mon_imr.resultados` / `.detalle` | propio | `rep2` (6304) |
| Monitor Efectividades | `mon-efec` | `RS_MON_EFEC_01`, `_02`, `_03`×2 | `cra-v4` | `reportData` |
| Seguimiento Reprogramados | `mon-efecrepro` | `RS_MON_EFECREPRO_01` | `cra-v7` | `reportData` |
| Efectividades Sin Asignar | `mon-efec-sinasig` | `RMESA_01` | `cra-V10` | `regularData` paginado |
| Top Variables de Riesgos | `top-efec` | `RSRTOPV01` ×3 | `cra-v1p1` | `regularData` |
| Reporte de Pago Puntual | `mon-efectramoscomer` | `RS_MON_EFECTRAMOSC_01` | `cra-v7` | `reportData` |
| Seguimiento de Portafolio | `ava-port` | `RS_AVA_POR_01` ×3 | `cra-v1p1` | `regularData` |

### components/Cero Cuotas Nuevas/

| Componente | Ruta legado | `cod_rep` | Strand |
|---|---|---|---|
| Dashboard | `graf-dashboard` | `rda/administracion/mora/Dashboard_rda_01` | `graphicData` |
| Dashboard en Revisión | `repositorio/cero-cuotas` | `REP_CERCUOT_01`, `_02` | `table.regular` |
| Cuadro de Mando | `cmd-cerocuotanueva` | `CMCUONUEV_01`, `_02` | `regularData` |
| Top | `Top-CeroCuota` | `CEROCUOTA_TOPCNUEVA_01`…`_05` ×2 cortes | `regularData` |
| Base de Gestión | `list-cero-cuotas` | `LCCUOTANUEVA_01` | `regularData` paginado |

## 3. Decisiones de mapeo que no son obvias

- **Strand por reporte.** `report.ts` deja `reportType` en `DEPRECATED` cuando la
  entrada del mapa no lo declara. Los tres monitores de efectividades viven en
  `com-map.module.ts` sin `reportType`, así que van por `reportData`
  (`BloqueReporteService.deprecado()`), no por `regularData`. Confundirlos
  devuelve el bloque vacío sin error.
- **`fec` vs `fecha`.** No son intercambiables y cada bloque declara el suyo.
  `BloqueReporteService` agrega `fec` solo; los que piden `fecha` lo reciben
  aparte.
- **`RSRTOPV`.** Su `id` en el mapa es `'01'` sin guion bajo, así que el código
  es `RSRTOPV01`. Sus tres bloques son el mismo `cod_rep` con distinto
  `tip_cod2`/`level`; igual pasa con `RS_AVA_POR_01` y su `mode`.
- **Dos `tipcuota` distintos.** "Cuadro de Mando"/"Top" usan
  `VariableNIngreso()` (ids `1`/`2`/`3`) y "Base de Gestión" usa
  `VariableNIngresoD()` (ids `TODO`/`Nuevo`/`Mantiene`). Se modelan como dos
  catálogos separados a propósito.
- **`REP_CERCUOT_*` se lee por posición.** El legado accede con
  `Object.values(row)[n]`, no por nombre; se replicó igual porque el `data` de
  esos bloques no trae claves estables.
- **Catálogos compartidos.** Los filtros del bloque `_02` de Monitor
  Efectividades (`Tramo01`, `Producto01`, `Boolean01`, `TramoVenc01`) ya estaban
  migrados en `Portafolio Reasignado/models`: se importan de ahí en vez de
  duplicarlos, igual que `Cartera` importa `ReporteBloqueUnico` de
  `Captaciones`. Solo se agregó `precosecha01()`, que no existía.
- **Nombres repetidos en el ejercicio.** El enunciado lista dos items llamados
  "CMG Cartera en Mora" (`cmg-mora` y `cmg-mora-simp`). Se desambiguaron según
  el título del legado: "MORA" y "MORA SIN IMPULSO".

## 4. Shared UI reutilizada

Ningún componente de este módulo pinta tabla, ventana ni filtro por su cuenta:

- `<app-reporte-simple>` + `ReporteSimpleBase` / `ReporteBloquesBase` — los 15
  reportes de tabla. Aporta ventana, selector de jerarquía, estado vacío,
  apilado de bloques, notas al pie y recarga por `effect` al cambiar un filtro.
- `<app-window-panel>`, `<app-hier-selector>`, `<app-empty-state>`,
  `<app-list-skeleton>` — Monitor IMR y los dos dashboards, que no encajan en
  `reporte-simple`.
- `<app-tabla-dinamica>` — tabla y detalle de Monitor IMR (columnas del backend).
- `<app-select-filtro>` — los 12 filtros del módulo.
- `<app-grafico-mixto>` — Dashboard y Dashboard en Revisión.
- `p-dialog` (PrimeNG) — el listado de clientes de Monitor IMR.

## 5. Pendiente declarado

`Dashboard en Revisión` migra los cuatro gráficos de cero cuotas
(`REP_CERCUOT_01`/`_02`). El archivo legado monta además, en el mismo
componente, la cabecera "Avance Comercial / Banca Individual" (cuatro KPI con
meta y % de avance) y dos mapas de calor, que salen de `RS_GEST_COM_*` /
`GRAF_GEST_COM_*` — los mismos strands de "Gestión Comercial" — con un cálculo
de metas propio repartido en 1.482 líneas.

Esa parte queda fuera a propósito: no se puede reproducir sin confirmar de dónde
sale cada meta, y poner números inventados en un tablero de banca es peor que no
mostrarlos. Es el siguiente paso natural del ejercicio.

## 6. Verificación

- `tsc --noEmit` sobre `tsconfig.app.json` y `tsconfig.spec.json`: limpio.
- `ng build --configuration production`: sin errores ni warnings.
- `ng test --watch=false`: 1214/1214.
- `e2e/cartera-en-mora.spec.ts`: 17/17 — cada ruta resuelve en su componente y
  la URL no cae en el comodín del módulo.
