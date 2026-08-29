# Migración: Actividad Mensual

## 1. Árbol de carpetas propuesto

```text
src/app/pages/modules/reportes/components/actividad-mensual/
├── actividad-mensual.routes.ts
├── models/
├── services/
└── components/
    ├── Aplicativo Movil/
    │   ├── aplicativo-movil.routes.ts
    │   └── items/
    │       └── plan-datos/
    ├── Tablero Digital/
    │   ├── tablero-digital.routes.ts
    │   └── items/
    │       └── tablero-digital-comercial/
    ├── Huella Carbono/
    │   ├── huella-carbono.routes.ts
    │   └── items/
    │       └── huella-carbono/
    ├── Portafolio Reasignado/
    │   ├── portafolio-reasignado.routes.ts
    │   └── items/
    │       ├── gestion-cartera-reasignada/
    │       └── gestion-cartera-stock/
    ├── Captaciones/
    │   ├── captaciones.routes.ts
    │   ├── components/
    │   │   ├── Captacion Comercial/
    │   │   │   └── items/
    │   │   │       └── captacion-canal/
    │   │   └── Captacion Operacional/
    │   │       └── items/
    │   │           └── captacion-operacional/
    │   └── items/
    │       ├── cmg-captaciones/
    │       └── seguimiento-bp/
    ├── Cartera/
    │   ├── cartera.routes.ts
    │   └── items/
    │       ├── cartera-producto/
    │       ├── cmg-cartera/
    │       ├── programas-gobierno/
    │       ├── contratacion-electronica/
    │       ├── ranking-autonomias-tasas/
    │       ├── estructura-desembolsos/
    │       ├── tasas-mes-producto/
    │       ├── comite-creditos/
    │       ├── datos-producto/
    │       └── cartera-agricola-cultivos/
    ├── Cartera en Mora/
    │   ├── cartera-en-mora.routes.ts
    │   └── items/
    │       ├── cmg-cartera-mora/
    │       ├── evolutivo-cosechas/
    │       ├── monitor-efectividades/
    │       ├── mora-efectividad-tramos/
    │       ├── monitor-efectividades-reasignados/
    │       ├── dashboard-cero-cuota-nueva/
    │       ├── gestion-cartera-reasignada-mes/
    │       ├── cmg-cartera-mora-sin-impulsa/
    │       └── semaforo-cosechas/
    ├── Clientes/
    │   ├── clientes.routes.ts
    │   └── items/
    │       ├── cmg-clientes-activo/
    │       ├── desempeno-social/
    │       └── cmg-clientes-flujo/
    ├── Rentabilidad/
    │   ├── rentabilidad.routes.ts
    │   └── items/
    │       └── resultados-unidad-negocio/
    └── Ranking Kaypacha/
        ├── ranking-kaypacha.routes.ts
        └── items/
            ├── comercial/
            ├── operaciones/
            └── recuperaciones/
```

## 2. Tabla de mapeo

*(Nota: Los valores de `cod_rep`, `Host`, `Strand`, `Bloques` y `Jerarquía` son aproximados para fines de la estructura; **deben validarse estrictamente contra `cra-map.ts` y `rda-administracion-routing.module.ts`** al momento de programar).*

| Reporte | Ruta legacy | cod_rep (Ref) | Host | Strand | Bloques (`id`) | Jerarquía |
|---|---|---|---|---|---|---|
| Plan de Datos | `/app_uso_m` | `APPUSO_M` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Tablero Digital Comercial | `/usa-come-m` | `TCOMER_M` | Repositorio | N/A | *A verificar* | *A verificar* |
| Huella Carbono | `/huella-carbono-m` | `HUELLA_M` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Gestión de Cartera Reasignada | `/gest_cart_her-flujo` | `GCARTH_F` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Gestión de Cartera Stock | `/gest_cart_stock` | `GCARTS` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| CMG Captaciones | `/cmg-capta` | `CMGCAP` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Seguimiento BP | `/seg-bp-men` | `SEGBP_M` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Captación por Canal (Com) | `/capta-caract-canal-comercial-m` | `CAPCAN_C` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Captación Operacional (Ope) | `/capta-caract-canal-operacional-m` | `CAPCAN_O` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Cartera por Producto | `/cart-prod` | `CARTPR` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| CMG Cartera | `/cmg-cartera-m` | `CMGCAR` | Repositorio | N/A | *A verificar* | *A verificar* |
| Programas del Gobierno | `/pro-gob-m` | `PROGOB` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Contratación Electrónica | `/cont-elect-m` | `CONELE` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Ranking de Autonomías de Tasas | `/rep-aut-tas` | `REPAUT` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Estructura de Desembolsos | `/estructura-desembolsos` | `ESTDES` | Repositorio | N/A | *A verificar* | *A verificar* |
| Tasas Mes por Producto | `/tp-mes` | `TPMES` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Comite de Créditos | `/seg_comite` | `SEGCOM` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Datos por Producto | `/dat-prod-men` | `DATPRO` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Cartera Agrícola - Cultivos | `/agro-mix-m` | `AGROMX` | Repositorio | N/A | *A verificar* | *A verificar* |
| CMG Cartera en Mora | `/cmg-mora` | `CMGMOR` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Evolutivo Cosechas | `/graf-cosechas` | `GRAFCO` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Monitor Efectividades | `/mon-efec` | `MONEFE` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Mora y Efectividad por Tramos | `/mor-efe` | `MOREFE_T` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Monitor Efectividades Reasignados| `/mon-efec-reasig` | `MONEFE_R` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Dashboard Cero Cuota Nueva | `/graf-dashboard-CN` | `DASHCN` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Gestión de Cartera Reasignada Mes| `/gest_cart_her` | `GCARTH` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| CMG Cartera en Mora Sin Impulsa | `/cmg-mora-simp-m` | `CMGMOS` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Semáforo de Cosechas | `/sema-cosechas` | `SEMCOS` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| CMG Clientes del Activo | `/cmg-cli` | `CMGCLI` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Desempeno Social | `/desemp-social` | `DESSOC` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| CMG Clientes Flujo | `/cmg_cliente_flujo` | `CMGCLF` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Resultados por Unidad de Negocio | `/res-un` | `RESUN` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Comercial | `/rank-kay` | `RANKAY_C` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Operaciones | `/rank-kay-ope` | `RANKAY_O` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |
| Recuperaciones | `/rank-kay-recu` | `RANKAY_R` | *A verificar* | *A verificar* | *A verificar* | *A verificar* |

## 3. Decisiones no obvias

* **Reportes de Repositorio:** Pantallas como *Tablero Digital Comercial*, *CMG Cartera*, *Estructura de Desembolsos* y *Cartera Agrícola - Cultivos* vienen con prefijo de ruta `/app/reportes/repositorio/actividad-mensual/...`. Estas no utilizarán la lógica habitual de `cra-map.ts`, sino que se conectarán directamente mediante el endpoint respectivo de `DataService` (fetchFn propio para repositorios).
* **Manejo de Fechas (Cierres Mensuales):** Al tratarse del módulo de *Actividad Mensual*, es casi seguro que los filtros de periodo no usen `p-datepicker` sino desplegables de cierres precargados (`RS_FECH` o `RS_FECH02`). Se deberá usar el selector `<app-select-filtro>` y consultar la lista de periodos mediante `BloqueReporteService.periodos(codRep)`.
* **Sub-Nodos Anidados en Captaciones:** El sub-nodo *Captaciones* presenta un tercer nivel de profundidad para *Captación Comercial* y *Captación Operacional*. Se incluyó la carpeta `components/` dentro de `Captaciones/` para manejar estos enrutamientos anidados limpiamente mediante su propio lazy loading.

## 4. Shared UI reutilizada

* `<app-reporte-simple>` y `ReporteSimpleBase` / `ReporteBloquesBase` en la mayoría de los reportes para centralizar el disparo de `consultar()` vía signals.
* `<app-select-filtro>` obligatorio para todos los selectores de mes/periodo en lugar del componente de calendario tradicional, previendo que el backend restringe las fechas a los cierres mensuales disponibles.
* `<app-window-panel>` y `<app-grafico-mixto>` / `<app-grafico-pie>` para pantallas analíticas como *Dashboard Cero Cuota Nueva* o *Evolutivo Cosechas*, validando siempre que la inyección de la data al gráfico se asigne correctamente (desde `data[0]` o `headers` según dicte el código legado).

## 5. Pendientes

* Extraer rigurosamente de `cra-map.ts` y `com-map.module.ts` los `cod_rep`, `Host`, `Strand`, `Bloques` y `Jerarquía` de las **35 pantallas listadas**, aplicando el "script de limpieza" mencionado en el prompt general para evitar caer en trampas de código comentado.

## 6. Verificación

Una vez finalizada la migración, se deberá ejecutar:

* `npx tsc --noEmit -p tsconfig.app.json` → OK
* `npx tsc --noEmit -p tsconfig.spec.json` → OK
* `npx ng build --configuration production` → OK (Sin warnings ni errores)
* `npx ng test --watch=false` → OK
* `npx playwright test e2e/actividad-mensual.spec.ts` → OK (Comprobar exhaustivamente cada una de las 35 rutas asegurando aserción de `page.url()`)