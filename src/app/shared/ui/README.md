# `shared/ui` — librería de componentes

Componentes de UI reutilizables del Host. La regla para que algo viva acá: **no debe saber de
ningún dominio**. Recibe data por `input()`, avisa por `output()`, y quien sabe qué significa esa
data es el módulo que lo usa.

Cada carpeta tiene su propio README con la API y ejemplos.

| Carpeta | Qué es |
|---|---|
| [`buscador/`](./buscador/README.md) | Búsqueda instantánea del Host; los módulos se suman registrando una `FuenteBusqueda` |
| [`data-table/`](./data-table/README.md) | Tabla plana de propósito general: buscador, filtros por columna, paginador |
| [`empty-state/`](./empty-state/README.md) | Lista sin datos |
| [`formularios/`](./formularios/README.md) | Controles de formulario genéricos (`<app-select-filtro>`) |
| [`graficos/`](./graficos/README.md) | Todas las gráficas, sobre Highcharts |
| [`hier-selector/`](./hier-selector/README.md) | Selector de jerarquía organizativa en cascada |
| [`inline-error/`](./inline-error/README.md) | Error de API dentro de la vista, con reintento |
| [`kpi-tile/`](./kpi-tile/README.md) | Tarjeta de indicador: valor compacto y variación con periodo |
| [`list-skeleton/`](./list-skeleton/README.md) | Skeleton de tabla mientras cargan datos |
| [`loading-overlay/`](./loading-overlay/README.md) | Spinner global (vía `LoadingService`) |
| [`mapas/`](./mapas/README.md) | Mapas sobre MapLibre (`<app-mapa-ubicacion>`) |
| [`redirect-overlay/`](./redirect-overlay/README.md) | Transición al salir a una plataforma externa |
| [`reporte-simple/`](./reporte-simple/README.md) | Contenedor reutilizable para reportes con jerarquía, tablas y bloques |
| [`tablas/`](./tablas/README.md) | Multi-encabezado, columnas anidadas y celdas editables |
| [`window-panel/`](./window-panel/README.md) | Panel de módulo con cromo de ventana macOS |

## Dónde va un modelo

Un componente compartido necesita tipos, y no todos son de UI. El criterio:

- **Contrato de render → acá.** Cómo se dibuja algo: `ColumnaReporte`, `ColumnaDinamica`,
  `OpcionFiltro`, `BloqueGrafico`.
- **Forma del payload → el módulo dueño.** Lo que devuelve un endpoint:
  `TablaReporteResultado`, `TablaRegularResponseBody`, `TABLA_VACIA`.
- **Catálogos de negocio → el módulo dueño.** `OPCIONES_CANAL`, `OPCIONES_PRODUCTO_PASIVO` y
  compañía se quedan en `reportes/models/filtros.model.ts`, aunque usen un tipo de acá.

Por eso `reportes/models/tabla-reporte.model.ts` existe todavía: importa de acá el contrato de
render y le suma el sobre que devuelve su motor de reportes.

También se aceptan contenedores de composición como `reporte-simple`: si la pieza solo define la
estructura visual y la integración con `app-hier-selector` / `app-tabla-reporte`, entonces es un
componente de UI compartible. La lógica de negocio y los mapeos del endpoint siguen perteneciendo a
`pages/modules/reportes`.

## Dependencias hacia afuera

`shared/` no importa de `pages/`: es la dirección que rompe la reutilización. Lo único que estos
componentes consumen de fuera es `shared/services/` — hoy `ThemeService`, que leen las gráficas y
el mapa para seguir el tema claro/oscuro.

## Qué NO se promueve

`docs/07-modulos/` es el volcado del sistema legado STG (`stg-app-mis-r22`), referencia de solo
lectura para migrar. Nada de ahí —`support/components/table/`, `select/`, `auto-complete/`,
`graphic/`— es código de esta app: no se compila, no se importa y usa librerías que el Host ya no
tiene. **No se mueve a shared**; cuando un módulo se migra, se reescribe contra los componentes de
esta carpeta.
