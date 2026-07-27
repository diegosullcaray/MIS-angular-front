# Documentación — MIS Host

> El MIS Host es un **router de sistemas** (microfrontends vía Native Federation) con una
> capa de interacción inspirada en **macOS**: minimalista, espaciosa, sin ruido visual.
> Ver [`01-canon/00-vision-producto.md`](./01-canon/00-vision-producto.md) para la
> síntesis completa de esta idea antes de leer cualquier otro documento.

Portal administrador centralizador (Micro-Frontend Host) de Financiera Confianza:
Angular 22 Zoneless + Native Federation + PrimeNG + Tailwind v4. Este índice organiza la
documentación en capas según con qué frecuencia cambian — el mismo criterio que ya
demostró funcionar en la auditoría del sistema anterior (ver
[`06-legado-sistema-anterior/README.md`](./06-legado-sistema-anterior/README.md)):
canon estable, arquitectura técnica, plan de trabajo vivo, bitácora que crece, referencia
cruda, y archivo histórico.

## Estructura

```
docs/
├── README.md                    este índice
├── 01-canon/                    el qué y el porqué del producto — cambia poco
│   └── 00-vision-producto.md      la síntesis: router de MFEs + usabilidad macOS
├── 02-arquitectura/             el cómo técnico — backend, BD, sistemas hijos, design system
├── 03-plan-implementacion/      EL PLAN VIVO — backlog de Historias de Usuario (HU)
├── 04-bitacora/                 registro de sesiones — crece con cada avance
├── 05-referencia/                mockups y volcados crudos, no se leen de corrido
└── 06-legado-sistema-anterior/  auditoría íntegra del sistema legado (stg-app-mis-r22), archivada como referencia y fuente de lecciones aprendidas
```

## Índice

### `01-canon/` — qué es el producto

| Documento | Contenido |
|---|---|
| [`00-vision-producto.md`](./01-canon/00-vision-producto.md) | **Empezar aquí.** La síntesis en una frase: router de microfrontends + usabilidad macOS, y la tabla de qué elemento de Angular/PrimeNG implementa cada pieza |
| [`01-prd.md`](./01-canon/01-prd.md) | Producto: problema de negocio, alcance del MVP, reglas de negocio, criterios de aceptación, **estado de implementación** |
| [`02-ux-app-flow.md`](./01-canon/02-ux-app-flow.md) | Mapa de rutas, árbol de componentes, reglas de sidebar/header/mensajería |
| [`03-trd.md`](./01-canon/03-trd.md) | Stack técnico, convenciones de arquitectura, Zoneless/Signals/Signal Forms, design system |

### `02-arquitectura/` — cómo se construye

| Documento | Contenido |
|---|---|
| [`01-backend-schema.md`](./02-arquitectura/01-backend-schema.md) | Backend Spring Boot: monolito modular (`auth`/`accesos`/`sistemas`), contrato `/api/v1` |
| [`02-database-schema.sql`](./02-arquitectura/02-database-schema.sql) | DDL PostgreSQL (baseline de Flyway) |
| [`03-guia-sistemas-hijos.md`](./02-arquitectura/03-guia-sistemas-hijos.md) | Cómo construir e integrar un Remote (ejemplo: `mis-remote-reportes`) |
| [`04-design-system-figma-guide.md`](./02-arquitectura/04-design-system-figma-guide.md) | Guía de importación a Figma y especificación de UX/UI |

### `03-plan-implementacion/` — el plan vivo

| Documento | Contenido |
|---|---|
| [`README.md`](./03-plan-implementacion/README.md) | Convenciones de HU, restricciones globales, backlog priorizado |
| [`00-estado-real.md`](./03-plan-implementacion/00-estado-real.md) | Auditoría de código vs. documentación (2026-07-26) — la base de por qué el backlog empieza donde empieza |
| [`historias/`](./03-plan-implementacion/historias/) | HU-00 a HU-07, de estabilización a primer sistema hijo real |
| [`00-plan-fases-original.md`](./03-plan-implementacion/00-plan-fases-original.md) | Plan anterior por fases (histórico, no se le agregan tareas) |

### `04-bitacora/` — ejecución

| Documento | Contenido |
|---|---|
| [`2026-07-26-analisis-inicial.md`](./04-bitacora/2026-07-26-analisis-inicial.md) | Primera entrada: comparación de documentación, hallazgos de código, decisiones tomadas y reestructura de `docs/` |
| [`2026-07-26-hu00-hu01-ejecucion.md`](./04-bitacora/2026-07-26-hu00-hu01-ejecucion.md) | Ejecución de HU-00 (elimina duplicado `admin/`, absorbe HU-02) y HU-01 (primeros tests, 24 en verde) |
| [`2026-07-26-vision-producto-canon.md`](./04-bitacora/2026-07-26-vision-producto-canon.md) | Se agrega `00-vision-producto.md` al canon: router de MFEs + usabilidad macOS, y su traducción a Angular/PrimeNG |
| [`2026-07-26-login-loadspinner-ui.md`](./04-bitacora/2026-07-26-login-loadspinner-ui.md) | Rediseño del login (branding, layout, errores solo por toast, bug del botón trabado corregido), MFA deshabilitado temporalmente en la UI, y `LoadSpinnerComponent` nuevo |
| [`2026-07-26-migracion-admin-home.md`](./04-bitacora/2026-07-26-migracion-admin-home.md) | `accesos/`+`sistemas/` fusionados en `admin/`, `inicio/` renombrado a `home/`, `help/` planeado (vacío) |
| [`2026-07-26-modulo-help.md`](./04-bitacora/2026-07-26-modulo-help.md) | `help/` construido: `FaqComponent`, `GuiasComponent`, `ContactoComponent` en `/admin/help/*`, sin `roleGuard` |
| [`2026-07-26-submodulos-admin.md`](./04-bitacora/2026-07-26-submodulos-admin.md) | `admin/` dividido en 3 submódulos independientes (`usuarios/`, `roles/`, `sistemas/`), `AccesosService` dividido en `UsuariosService`+`RolesService`, `AccesosShellComponent` retirado, URLs `/admin/usuarios` y `/admin/roles` |

### `05-referencia/` — volcados crudos

| Documento | Contenido |
|---|---|
| [`figma/`](./05-referencia/figma/) | Mockups HTML interactivos: kit UX, login, dashboard, gestión IAM |

### `06-legado-sistema-anterior/` — archivo histórico

Auditoría completa del sistema anterior (`stg-app-mis-r22`, Angular 14, 122k LOC):
arquitectura, 24 hallazgos de refactorización, plan de refactorización en 6 fases,
bitácora de ejecución y diseño de componentes. Se conserva intacta porque el diagnóstico
de esa auditoría ("la deuda no viene de mala arquitectura sino de un proceso que premia
copiar sobre reusar") es exactamente la lección que motiva las restricciones globales del
plan de HU de este proyecto. Ver su propio índice en
[`06-legado-sistema-anterior/README.md`](./06-legado-sistema-anterior/README.md).

---

## Resumen ejecutivo

El **MIS Host** es un router de sistemas: un shell administrador Angular que centraliza
navegación, autenticación (MFA especificado, UI del OTP deshabilitada temporalmente — ver
PRD §9) e IAM (usuarios/roles), y enruta en tiempo de ejecución hacia subsistemas de
negocio (Remotes) vía Native Federation — nunca iframes — con una identidad de
interacción inspirada en macOS (ver [`00-vision-producto.md`](./01-canon/00-vision-producto.md)).
El frontend del Host está mayormente construido contra una Fake API que implementa 1:1 el
contrato del backend real (aún no construido). Una auditoría de código del 2026-07-26
encontró que ese frontend, aunque sustancialmente avanzado, tenía deuda ya acumulada (un
módulo duplicado y roto, rutas reales que no coincidían con lo documentado, cero tests) —
ya resuelta el mismo día (HU-00/HU-01/HU-02) — ver
[`00-estado-real.md`](./03-plan-implementacion/00-estado-real.md).

## Hacia dónde apunta el plan

El backlog de [`03-plan-implementacion/`](./03-plan-implementacion/README.md) prioriza
**estabilizar lo real antes de sumar lo que falta**: primero eliminar la duplicación y
poner una primera red de tests (HU-00, HU-01), después alinear documentación y código
(HU-02), y solo entonces avanzar hacia dockerización, backend real y el primer sistema
hijo (HU-03 a HU-07).
