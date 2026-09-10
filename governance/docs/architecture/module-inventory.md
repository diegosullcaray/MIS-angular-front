# Inventario de módulos y rutas

Las rutas bajo `/app` se conservan compatibles con el `act_sec` del menú STG: no son nombres elegidos.

## Módulos enlazados

La tabla se deriva de `src/app/app.routes.ts` y de los `*.routes.ts` de cada módulo. **No editar a mano**: regenerar con `npm run inventario` (o verificar con `npm run inventario:check`).

<!-- generado:inicio modulos -->
<!-- Generado por governance/scripts/generar-inventario.mjs — 2026-09-10 · commit c3f5393. No editar a mano. -->

| Módulo | Ruta base | Archivos `*.routes.ts` | Destinos de ruta | Componentes | Servicios | Specs |
|---|---|---:|---:|---:|---:|---:|
| `actividades` | `/app/actividades` | 1 | 4 | 6 | 1 | 7 |
| `analista` | `/app/analista` | 1 | 4 | 6 | 1 | 7 |
| `categorizacion` | `/app/analista/categorizacion` | 1 | 1 | 2 | 1 | 3 |
| `dashboard` | `/app/dashboards` | 1 | 2 | 3 | 2 | 5 |
| `framework-esg` | `/app/esg` | 1 | 1 | 4 | 2 | 6 |
| `herramientas` | `/app/cons_base_negativa` | 1 | 1 | 3 | 1 | 4 |
| `home` | `/app/dashboard` | 1 | 2 | 2 | 2 | 4 |
| `incentivos` | `/app/incentivos3` | 1 | 1 | 11 | 1 | 14 |
| `kaypacha` | `/app/Kaypacha__` | 1 | 1 | 2 | 2 | 4 |
| `presupuesto` | `/app/presupuesto` | 1 | 7 | 8 | 1 | 13 |
| `ranking-k` | `/app/ranking-k` | 1 | 2 | 5 | 1 | 6 |
| `reportes` | `/app/reportes` | 30 | 151 | 154 | 61 | 206 |

_Total: 12 módulos enlazados desde `app.routes.ts`._
<!-- generado:fin -->

## Qué significa cada columna

- **Archivos `*.routes.ts`**: cuántos archivos de ruta compone el módulo. Más de uno indica subdominios.
- **Destinos de ruta**: cuántos `loadComponent` / `loadChildren` declara en total.
- **Componentes / Servicios / Specs**: superficie del módulo, útil para dimensionar un cambio.

Ninguna de estas cifras mide paridad funcional ni cobertura de negocio.

## Dominios

| Dominio | Alcance observado |
|---|---|
| Home | Inicio, recientes y accesos rápidos |
| Ranking K | Ranking, categorías y recorridos guiados |
| Kaypacha | Dashboard geográfico y colaboradores |
| Actividades | Destino de crédito, prospectos y transacciones corresponsal |
| Herramientas | Base negativa y consultas de riesgo |
| Presupuesto | Líneas de cartera, pasivos, seguros y gestión |
| Categorización | Dashboard y selección de sectorista |
| Analista | Principal, listas, becas y priorización de leads |
| ESG | Framework ESG y métricas |
| Dashboards | Lista de reportes Power BI y usuarios por reporte |
| Incentivos | Incentivos de tercera generación |
| Reportes | Reportería operativa, comercial, cartera y sostenibilidad |

### El módulo `reportes`

Concentra la mayor superficie funcional y compone rutas de subdominio desde archivos separados: Clientes, Cartera, Cartera en Mora, Captaciones, Portafolio Reasignado, Seguros, Campañas, Proyecciones, Tablero Digital, Reportes PDM, Actividad Mensual, Avance Comercial y Analista. Ver [`skills/mis-reportes-bloques`](../../skills/mis-reportes-bloques/SKILL.md).

## Restricciones de navegación

- `analista/categorizacion` debe declararse **antes** que `analista`.
- `dashboard` (Home) y `dashboards` (Power BI) son dominios distintos.
- `Kaypacha__`, `incentivos3` y `cons_base_negativa` son nombres de compatibilidad, no un estilo a imitar.
- Las rutas desconocidas terminan en `/error` o en Not Found según el nivel de resolución.

## Estado de migración

Que exista la ruta no prueba paridad funcional. Para marcar un dominio como migrado hay que cruzar ruta, componente, servicio Ant, modelos, pruebas unitarias y E2E. Los comentarios de rutas señalan faltantes explícitos en Analista (`prospecto` y `detalle`) y variantes heredadas que solo conservan compatibilidad.
