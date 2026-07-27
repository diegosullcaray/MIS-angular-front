> **Documentacion:** [Indice](../README.md) | [Plan de implementacion](../03-plan-implementacion/README.md)

# 2026-07-26 — Análisis inicial y reestructura de `docs/`

## Qué se comparó

Los dos sets de documentación que existían en `docs/`:
- `doc_anterior sistema/doc/` — auditoría del legado `stg-app-mis-r22` (Angular 14,
  122k LOC), ya organizada en `01-analisis/02-bitacora/03-referencia/04-componentes`.
- `doc_nuevo sistema/` — PRD, TRD, UX flow, backend schema, guía de sistemas hijos y plan
  de implementación del MIS Host (Angular 22), en una carpeta plana.

Y, para validar qué tan al día estaba `doc_nuevo sistema/05_IMPLEMENTATION_PLAN.md`
(marcaba Fases 0–5 como `COMPLETADA`), se auditó `src/app` directamente.

## Qué se encontró

- `pages/modules/admin/` (scaffold vacío, `admin.routes.ts` con un import roto) está
  enrutado y activo; `pages/modules/accesos/` y `pages/modules/sistemas/` (módulos
  completos) no están enrutados en ningún lado — código muerto compitiendo con un
  duplicado roto. Mismo patrón que el legado diagnosticó como "forkear en vez de
  parametrizar".
- Las rutas reales usan el prefijo `/inicio/...`; la documentación (PRD, UX flow,
  mockups Figma) usa `/admin/...` — cualquier URL documentada da 404 hoy.
- `src/app/pages/modules/inicio/components/dd` — archivo suelto de 0 bytes, sin uso.
- 0 archivos `.spec.ts` en todo `src/app`.

Detalle completo con evidencia por archivo/línea en
[`../03-plan-implementacion/00-estado-real.md`](../03-plan-implementacion/00-estado-real.md).

## Qué se decidió (con el usuario, en esta sesión)

1. **Documentar el hallazgo de duplicación sin tocar código** — la tarea de esta sesión
   es documentación; la corrección de código queda como HU-00 del backlog.
2. **Reestructurar físicamente `docs/`** reemplazando las dos carpetas planas por una
   jerarquía única numerada (`01-canon` a `06-legado-sistema-anterior`), con el sistema
   anterior archivado íntegro como referencia histórica.
3. **Reemplazar el plan por fases por un backlog de Historias de Usuario**, empezando
   por el estado real del código (estabilización) y no por el estado aspiracional que
   describía el plan viejo.

## Qué se movió

| Antes | Ahora |
|---|---|
| `doc_nuevo sistema/01_PRD.md` | `01-canon/01-prd.md` |
| `doc_nuevo sistema/02_UI_UX_APP_FLOW.md` | `01-canon/02-ux-app-flow.md` |
| `doc_nuevo sistema/03_TRD.md` | `01-canon/03-trd.md` |
| `doc_nuevo sistema/Backend/04_BACKEND_SCHEMA.md` | `02-arquitectura/01-backend-schema.md` |
| `doc_nuevo sistema/Backend/07_DATABASE_SCHEMA.sql` | `02-arquitectura/02-database-schema.sql` |
| `doc_nuevo sistema/08_GUIA_SISTEMAS_HIJOS.md` | `02-arquitectura/03-guia-sistemas-hijos.md` |
| `doc_nuevo sistema/FIGMA/06_FIGMA_UX_KIT_GUIDE.md` | `02-arquitectura/04-design-system-figma-guide.md` |
| `doc_nuevo sistema/FIGMA/*.html` | `05-referencia/figma/*.html` (nombres a kebab-case) |
| `doc_nuevo sistema/05_IMPLEMENTATION_PLAN.md` | `03-plan-implementacion/00-plan-fases-original.md` (histórico) |
| `doc_anterior sistema/doc/*` | `06-legado-sistema-anterior/*` (sin cambios de contenido) |
| `docs/ss` (archivo vacío suelto) | eliminado |

Se creó `03-plan-implementacion/README.md`, `00-estado-real.md` y las 8 HU
(`historias/HU-00` a `HU-07`), y se corrigió la sección "Estado de Implementación"
(§9) de `01-canon/01-prd.md` para reflejar el estado real en vez del aspiracional.
Todos los enlaces `file:///f:/FINACIERA%20CONFIANZA/...` (rutas absolutas a una máquina
que ya no aplica) se reescribieron como enlaces relativos entre los documentos movidos.

## Próximo paso concreto

Empezar por [HU-00](../03-plan-implementacion/historias/HU-00-estabilizacion-admin-duplicado.md)
(eliminar el duplicado `admin/`) idealmente junto con
[HU-01](../03-plan-implementacion/historias/HU-01-red-de-seguridad-tests.md) (primeros
tests) para no tocar el enrutado sin red de seguridad.
