# Catalogo de componentes compartidos

La libreria compartida debe permanecer agnostica del dominio. Los componentes reciben datos por `input()` y emiten eventos por `output()`; no conocen roles, `cod_rep` ni endpoints concretos.

| Familia | Componente | Contrato principal | Estados o riesgos |
|---|---|---|---|
| Datos | `app-data-table` | `columns`, `data`, `loading`, busqueda y filtros | fecha, numero, dropdown, vacio y refresh |
| Reportes | `app-tabla-reporte` | headers multi-fila y filas | hidden, colspan, semaforo, estilos backend |
| Reportes | `app-tabla-dinamica` | columnas anidadas y filas | formato numerico, variaciones, semaforo, celdas clicables |
| Formularios | `app-select-filtro`, `app-input-filtro` | opciones/valor/eventos | filtros dependientes del modulo |
| Jerarquia | `app-hier-selector` | `ParamsJerarquia`, nodo/ruta/error | cache, fecha de corte, fallback, reset |
| Visualizacion | `app-grafico-base`, `app-grafico-mixto`, `app-grafico-pie` | opciones o modelos graficos | destruir instancia, tema, click de punto |
| Mapas | `app-mapa-ubicacion` | latitud, longitud, etiqueta | tiles externos, pin, resize, cleanup |
| Estados | `app-empty-state`, `app-inline-error`, `app-list-skeleton`, `app-loading-overlay` | mensajes y acciones | no mezclar vacio con error |
| Navegacion | `app-buscador` | fuentes multi-provider | teclado, facetas, limite de resultados |
| Layout | `app-window-panel`, `app-redirect-overlay` | titulo, navegacion, transicion | responsive y foco |

## Contratos importantes

- Un estado vacio significa respuesta valida sin filas.
- Un error inline debe ofrecer reintento cuando la operacion sea repetible.
- `loading` no debe borrar los datos existentes si el componente puede mostrar refresco no destructivo.
- Los graficos destruyen la instancia Highcharts al destruirse el componente.
- El mapa elimina `ResizeObserver`, marcador y mapa MapLibre al destruirse.
- La accesibilidad de botones de mapa, teclado del buscador y foco visible forma parte del contrato, no es decoracion.

## Limite de ubicacion

`ReporteSimpleComponent` y sus bases son reutilizables dentro del dominio de reportes, pero viven en `src/app/pages/modules/reportes/ui/`, no en `src/app/shared/ui/`, porque integran jerarquia y contratos de reportes.
