# Inventario de modulos y rutas

Inventario derivado de `src/app/app.routes.ts` y de los archivos `*.routes.ts`. Las rutas bajo `/app` se conservan compatibles con `act_sec` del menu STG.

## Dominios principales

| Dominio | Ruta base | Carga | Alcance observado |
|---|---|---|---|
| Home | `/app/dashboard` | Lazy local | Inicio, recientes y accesos rapidos |
| Ranking K | `/app/ranking-k` | Lazy local | Ranking, categorias y recorridos guiados |
| Kaypacha | `/app/Kaypacha__` | Lazy local | Dashboard geografico y colaboradores |
| Actividades | `/app/actividades` | Lazy local | Destino de credito, prospectos y transacciones corresponsal |
| Herramientas | `/app/cons_base_negativa` | Lazy local | Base negativa y consultas de riesgo |
| Presupuesto | `/app/presupuesto` | Lazy local | Lineas de cartera, pasivos, seguros y gestion |
| Categorizacion | `/app/analista/categorizacion` | Lazy local | Dashboard y seleccion de sectorista |
| Analista | `/app/analista` | Lazy local | Principal, listas, becas y priorizacion de leads |
| ESG | `/app/esg` | Lazy local | Framework ESG y metricas |
| Dashboards | `/app/dashboards` | Lazy local | Lista de reportes Power BI y usuarios por reporte |
| Incentivos | `/app/incentivos3` | Lazy local | Incentivos de tercera generacion |
| Reportes | `/app/reportes` | Lazy local | Actividad diaria/mensual, avance comercial, desarrollo sostenible y analista |

## Reportes

El modulo `reportes` compone rutas de subdominio desde archivos separados. No es un unico componente: concentra una gran superficie funcional con Clientes, Cartera, Cartera en Mora, Captaciones, Portafolio Reasignado, Seguros, Campanas, Proyecciones, Tablero Digital, Reportes PDM, Actividad Mensual, Avance Comercial y Analista.

## Estado de migracion

La ruta no prueba por si sola paridad funcional. Para marcar un dominio como migrado se deben cruzar: ruta, componente, servicio Ant, modelos, pruebas unitarias y E2E. Los comentarios de rutas indican faltantes explicitos en Analista (`prospecto` y `detalle`) y variantes heredadas que solo conservan compatibilidad.

## Restricciones de navegacion

- La ruta `analista/categorizacion` debe declararse antes de `analista`.
- `dashboard` de Home y `dashboards` de Power BI son dominios distintos.
- `Kaypacha__`, `incentivos3` y `cons_base_negativa` son nombres de compatibilidad, no nombres recomendados para nuevas APIs.
- Las rutas desconocidas terminan en `/error` o en el componente Not Found segun el nivel de resolucion.
