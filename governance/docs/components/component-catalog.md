# Catalogo de componentes compartidos

La libreria compartida debe permanecer agnostica del dominio. Los componentes reciben datos por `input()` y emiten eventos por `output()`; no conocen roles, `cod_rep` ni endpoints concretos.

| Familia | Componente | Contrato principal | Estados o riesgos |
|---|---|---|---|
| Datos | `app-data-table` | `columns`, `data`, `loading`, busqueda, filtros, paginador y seleccion de fila | esqueleto con `loading`; alto maximo (`appMaxFilas`); fecha, numero, dropdown, vacio y refresh |
| Reportes | `app-tabla-reporte` | headers multi-fila, filas, `cargando`, `ajustarAncho`, `encabezadoUniforme` | esqueleto; alto maximo; hidden, colspan, semaforo, estilos backend, contraste sobre fondo |
| Reportes | `app-tabla-dinamica` | columnas anidadas, filas, `cargando`, `filasPorPagina` | esqueleto; alto maximo; paginacion en cliente; formato numerico, variaciones, semaforo, celdas clicables |
| Reportes | `app-editable-table` | columnas con grupos, filas, `cargando`, `esEditable` | esqueleto; alto maximo; muta la fila al editar |
| Formularios | `app-select-filtro`, `app-input-filtro`, `app-grupo-filtros` | opciones/valor/eventos; la baldosa agrupa los filtros propios | filtros dependientes del modulo; baldosa vacia se oculta |
| Reportes | `app-tarjeta-meta`, `app-ruta-jerarquica` (módulo reportes) | tarjeta KPI contra meta con aro o variación; migas del drill down | aro animado por el contenedor; sin botón "Volver" |
| Estados | `app-chip-informativo` | `texto`, `severidad`, `icono` | notas cortas sobre una tabla (unidad, indicador de pestaña) |
| Jerarquia | `app-hier-selector` | `ParamsJerarquia`, nodo/ruta/error | cache, fecha de corte, fallback, reset |
| Visualizacion | `app-grafico-base`, `app-grafico-mixto`, `app-grafico-pie` | opciones o modelos graficos | destruir instancia, tema, click de punto |
| Mapas | `app-mapa-ubicacion` | latitud, longitud, etiqueta | tiles externos, pin, resize, cleanup |
| Estados | `app-empty-state`, `app-inline-error`, `app-list-skeleton`, `app-loading-overlay` | mensajes y acciones; el overlay lo maneja `LoadingService` | no mezclar vacio con error; `app-list-skeleton` no reemplaza a una tabla compartida |
| Navegacion | `app-buscador` | fuentes multi-provider | teclado, facetas, limite de resultados |
| Layout | `app-window-panel`, `app-redirect-overlay` | titulo, navegacion, transicion | responsive y foco |
| Guias | `DriverTourService` (servicio, no componente) | pasos con selector y globo | ancla inexistente = paso saltado en silencio |

## Contratos importantes

- Un estado vacio significa respuesta valida sin filas.
- `app-data-table` no guarda la seleccion: con `selectableRows` avisa el clic por `filaSeleccionada` y resalta la fila que le pasen en `selectedRow`. El estado vive en el consumidor.
- `app-window-panel` y el tema de `p-dialog` comparten el semaforo: una luz que no hace nada va apagada, nunca de color — ver [ventanas y dialogos](./ventanas-y-dialogos.md).
- Un error inline debe ofrecer reintento cuando la operacion sea repetible.
- En las tablas, `cargando`/`loading` en `true` oculta las filas (tambien las de la consulta anterior) y pinta el esqueleto dentro de la tarjeta: es obligatorio enlazarlo a la carga real (regla `tabla-con-esqueleto`). Ver [estandar de reportes](./estandar-reportes.md#2-tablas).
- Las cuatro tablas limitan su alto (16 filas / 62 % de la ventana) con scroll interno y encabezado fijo; el paginador va dentro de la tarjeta.
- Los graficos destruyen la instancia Highcharts al destruirse el componente.
- El mapa elimina `ResizeObserver`, marcador y mapa MapLibre al destruirse.
- La accesibilidad de botones de mapa, teclado del buscador y foco visible forma parte del contrato, no es decoracion.

## Documentacion junto al codigo

Cada familia de `src/app/shared/ui/` tiene su propio `README.md` al lado del componente, con el contrato detallado. Ese README es la fuente de verdad del componente; esta tabla es el mapa.

Las reglas de KPI viven en [KPI guidelines](./kpi-guidelines.md) y se aplican en los componentes del modulo dueno del dato; las tarjetas contra meta usan `app-tarjeta-meta`.

## Limite de ubicacion

`ReporteSimpleComponent` y sus bases son reutilizables dentro del dominio de reportes, pero viven en `src/app/pages/modules/reportes/ui/`, no en `src/app/shared/ui/`, porque integran jerarquia y contratos de reportes.
