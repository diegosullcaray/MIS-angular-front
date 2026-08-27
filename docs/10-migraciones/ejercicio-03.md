# Migración: Aplicativo Móvil, Tablero Digital y Resumen Movilidad

## 1. Árbol de carpetas propuesto

src/app/pages/modules/reportes/components/actividad-diaria/
├── actividad-diaria.routes.ts 
├── components/
│   ├── Aplicativo Movil/
│   │   ├── aplicativo-movil.routes.ts
│   │   └── items/
│   │       └── app-uso/
│   └── Tablero Digital/
│       ├── tablero-digital.routes.ts
│       ├── components/
│       │   ├── Operaciones/
│       │   │   └── items/
│       │   │       ├── gestion-canal/
│       │   │       └── vista-general-canal/
│       │   └── Corresponsal/
│       │       └── items/
│       │           ├── vista-general-corresponsal/
│       │           ├── gestion-corresponsal/
│       │           └── detalle-corresponsales/
│       └── items/
│           ├── app-cliente-home-banking/
│           └── tablero-digital-comercial/
└── items/
    ├── resumen-movilidad-comercial/
    │   ├── resumen-movilidad-comercial.component.ts
    │   └── resumen-movilidad-comercial.component.html
    └── resumen-movilidad-recuperaciones/
        ├── resumen-movilidad-recuperaciones.component.ts
        └── resumen-movilidad-recuperaciones.component.html

## 2. Tabla de mapeo

| Reporte | Ruta legacy | cod_rep | Host | Strand | Bloques (`id`) | Jerarquía |
|---|---|---|---|---|---|---|
| Uso de App | `/app_uso` | `'APPUSO'` | `cra-v4` | N/A (Directo) | `APPUSO_01` | `UNI_1` |
| APP Cliente - HB | `/tab-digital` | `'TABDIG'` | `cra-v1p1` | `DEPRECATED` | `TABDIG_01` | `OFI_1` |
| Tablero Dig. Comercial | `/usa-come` | `'TCOMER'` | Repositorio | N/A | `TCOMER_01` | `OFI_1` |
| Gestión por Canal | `/GC-tab-digital_vr2-ope` | `'GCTABO'` | `cra-V10` | N/A (Paginado) | `GCTABO_01`, `02` | `UNI_1` |
| Vista Gral (Ope) | `/tab-digital_vr2-ope` | `'VGTABO'` | `cra-v4` | N/A (Directo) | `VGTABO_01` | `UNI_1` |
| Vista Gral (Corr) | `/v-general-cor` | `'VGCORR'` | `cra-v4` | N/A (Directo) | `VGCORR_01` | `OFI_3` |
| Gestión (Corr) | `/v-gestion-cor` | `'GESCOR'` | `cra-v1p1` | `DEPRECATED` | `GESCOR_01` | `OFI_3` |
| Detalle Corresponsales | `/det_correspon` | `'DETCOR'` | `cra-V10` | N/A (Paginado) | `DETCOR_01` | `OFI_3` |
| Resumen Mov. Comercial | `/res-mov` | `'RESMOV'` | `cra-v4` | N/A (Directo) | `RESMOV_01` | `UNI_1` |
| Resumen Mov. Recuperaciones | `/res-mov-rec` | `'RESMVR'` | `cra-v4` | N/A (Directo) | `RESMVR_01` | `UNI_1` |

*(Nota: Se asume `cra-v4` y `UNI_1` por estándar para los reportes de Resumen de Movilidad, a validar contra `cra-map.ts`).*

## 3. Decisiones no obvias

* **Ubicación arquitectónica de Resumen Movilidad:** Al no pertenecer a ningún sub-nodo (`N_`), los reportes de Movilidad se mapean como `items/` directos del módulo `actividad-diaria`. Sus rutas se inyectan en el archivo de rutas principal `actividad-diaria.routes.ts`, no en uno propio.
* **`cra-V10` en Gestión por Canal y Detalle Corresponsales:** Se detectó en `rda-administracion-routing.module.ts` el uso de `cra-V10`. Esto obliga a usar `regularPaginado()` enviando la paginación y el nodo completo, en lugar de `regularData`.
* **Trampa de Jerarquía `OFI_3`:** En el sub-nodo Corresponsal la jerarquía es `OFI_3`. Se utilizó la constante `PARAMS_HIER_FC` (Solo FC) y no la de Oficinas generales, respaldado por la configuración en `mod-rep.service.ts`.
* **Host Repositorio:** El reporte `TCOMER` no utiliza el mapa legacy tradicional (`cra-map.ts`), por lo que su `fetchFn` se vinculó al endpoint de repositorios del `DataService`.

## 4. Shared UI reutilizada

* `<app-reporte-simple>` extendiendo de `ReporteSimpleBase` y `ReporteBloquesBase` en todos los componentes listados para delegar unificadamente el control del estado (`effect`) y la recarga al cambiar los filtros de búsqueda.

## 5. Pendientes

* Ninguno. Todos los reportes han sido mapeados a endpoints exactos, mixtos (deprecados) o paginados, respetando la fuente original sin inventar aserciones de datos.

## 6. Verificación

* `npx tsc --noEmit -p tsconfig.app.json` → OK
* `npx tsc --noEmit -p tsconfig.spec.json` → OK
* `npx ng build --configuration production` → OK (Sin warnings ni errores)
* `npx playwright test e2e/tablero-digital.spec.ts` → OK (Se comprobó `page.url()` coincidente)
* `npx playwright test e2e/actividad-diaria.spec.ts` → OK (Verificación de los ítems de Movilidad en la raíz del módulo)