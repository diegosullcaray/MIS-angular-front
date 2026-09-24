# Inventario de módulos y rutas

Las rutas bajo `/app` se conservan compatibles con el `act_sec` del menú STG: no son nombres elegidos.

## Módulos enlazados

La tabla se deriva de `src/app/app.routes.ts` y de los `*.routes.ts` de cada módulo. **No editar a mano**: regenerar con `npm run inventario` (o verificar con `npm run inventario:check`).

<!-- generado:inicio modulos -->
<!-- Generado por governance/scripts/generar-inventario.mjs — 2026-09-24 · commit b4af615. No editar a mano. -->

| Módulo | Ruta base | Archivos `*.routes.ts` | Destinos de ruta | Componentes | Servicios | Specs |
|---|---|---:|---:|---:|---:|---:|
| `actividades` | `/app/actividades` | 1 | 4 | 6 | 1 | 7 |
| `categorizacion` | `/app/analista/categorizacion` | 1 | 1 | 2 | 1 | 3 |
| `consulta-fen` | `/app/consulta-fen` | 1 | 1 | 1 | 1 | 2 |
| `dashboard` | `/app/dashboards` | 1 | 2 | 3 | 2 | 5 |
| `framework-esg` | `/app/esg` | 1 | 1 | 4 | 2 | 6 |
| `herramientas` | `/app/cons_base_negativa` | 1 | 1 | 3 | 1 | 4 |
| `home` | `/app/dashboard` | 1 | 2 | 4 | 2 | 5 |
| `incentivos` | `/app/incentivos3` | 1 | 1 | 11 | 1 | 15 |
| `kaypacha` | `/app/Kaypacha__` | 1 | 1 | 2 | 2 | 4 |
| `ranking-k` | `/app/ranking-k` | 1 | 2 | 5 | 1 | 6 |
| `reportes` | `/app/reportes` | 30 | 130 | 133 | 53 | 185 |

_Total: 11 módulos enlazados desde `app.routes.ts`._
<!-- generado:fin -->

## Enlaces fuera de la tabla

<!-- generado:inicio enlaces -->
<!-- Generado por governance/scripts/generar-inventario.mjs — 2026-09-24 · commit a79566d. No editar a mano. -->

**Pantallas enlazadas directamente desde `app.routes.ts`** (no pasan por el `*.routes.ts` de su módulo):

- `/app/analista/panel-unificado` → `reportes/components/analista/items/panel-asesor/panel-asesor.component.ts`

**Módulos sin ruta** (la carpeta existe pero ninguna ruta la carga; regla `modulo-enrutado`):

- `prospecto` — enlazarlo o retirarlo (ver [guía de retiro](../development/report-retirement-guide.md)).
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
| Categorización | Dashboard y selección de sectorista |
| ESG | Framework ESG y métricas |
| Dashboards | Lista de reportes Power BI y usuarios por reporte |
| Incentivos | Incentivos de tercera generación |
| Reportes | Reportería operativa, comercial, cartera y sostenibilidad |

### El módulo `reportes`

Concentra la mayor superficie funcional y compone rutas de subdominio desde archivos separados: Clientes, Cartera, Cartera en Mora, Captaciones, Portafolio Reasignado, Seguros, Campañas, Proyecciones, Tablero Digital, Reportes PDM, Actividad Mensual, Avance Comercial, Desarrollo Sostenible y Analista. Ver [`skills/mis-reportes-bloques`](../../skills/mis-reportes-bloques/SKILL.md).

El subdominio Analista (`reportes/components/analista/`) aloja además el **panel unificado del asesor** (`items/panel-asesor/`): una vista 360 que reúne los 17 reportes `rda/sectorista` sin duplicar sus consultas. Se publica en `/app/analista/panel-unificado` directamente desde `app.routes.ts` ([ADR-0006](./adr/ADR-0006-panel-unificado-en-reportes.md)).

## Restricciones de navegación

- `/app/analista/*` ya no es un módulo: solo existen `analista/panel-unificado` (pantalla de `reportes`) y `analista/categorizacion` (módulo `categorizacion`). Cualquier otra URL bajo `analista/` termina en Not Found.
- `dashboard` (Home) y `dashboards` (Power BI) son dominios distintos.
- `Kaypacha__`, `incentivos3` y `cons_base_negativa` son nombres de compatibilidad, no un estilo a imitar.
- Las rutas desconocidas terminan en `/error` o en Not Found según el nivel de resolución.

## Estado de migración

Que exista la ruta no prueba paridad funcional. Para marcar un dominio como migrado hay que cruzar ruta, componente, servicio Ant, modelos, pruebas unitarias y E2E.

Los módulos y reportes que se retiran quedan registrados en [ADR-0007](./adr/ADR-0007-retiro-de-reportes-sin-uso.md), con el procedimiento de la [guía de retiro](../development/report-retirement-guide.md).
