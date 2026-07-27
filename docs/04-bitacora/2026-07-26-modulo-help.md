> **Documentacion:** [Indice](../README.md) | [PRD §9](../01-canon/01-prd.md) | [UX/App Flow](../01-canon/02-ux-app-flow.md)

# 2026-07-26 — Módulo `help/` construido (FAQ, guías, contacto)

Quinta sesión del día. Continuación directa de la migración a `admin/`
(ver [`2026-07-26-migracion-admin-home.md`](./2026-07-26-migracion-admin-home.md)):
`help/` quedó como scaffold vacío, planeado para "ayuda/soporte/FAQ". El usuario pidió
construirlo con los 3 componentes acordados en esa sesión (FAQ, guías de uso, contacto
a soporte).

## Qué se construyó

Tres componentes independientes, sin un shell/landing adicional — el mismo patrón que
ya usa el sidebar para "Accesos [Admin]" (una entrada por sección, no pestañas dentro de
una sola pantalla):

- **`FaqComponent`** (`/admin/help/faq`) — `p-accordion` de PrimeNG (API nueva:
  `p-accordion-panel` + `p-accordion-header` + `p-accordion-content`) con 5 preguntas
  frecuentes sobre login, contraseña, visibilidad de sistemas en el sidebar, estado de
  mantenimiento y quién gestiona usuarios/roles.
- **`GuiasComponent`** (`/admin/help/guias`) — 3 cards informativas (iniciar sesión,
  gestionar usuarios y roles, navegar entre sistemas), mismo estilo visual que las
  "management boxes" de `AccesosShellComponent`.
- **`ContactoComponent`** (`/admin/help/contacto`) — card con correo, teléfono y horario
  de soporte, usando los mismos tokens de color que el resto del Host.

`help.routes.ts` redirige `''` → `faq`. Ruta `/admin/help` registrada en `app.routes.ts`
**sin `roleGuard`** — a diferencia de `accesos`/`sistemas`, la ayuda debe verla
cualquier usuario autenticado, sin importar su rol. Se agregó un enlace "Ayuda" en la
sección "Acceso directo" del sidebar (junto a "Mi espacio") y las etiquetas de
breadcrumb correspondientes (`help`, `faq`, `guias`, `contacto`) en
`SEGMENTO_LABELS` de `HeaderComponent`.

## Estado tras esta sesión

`pages/modules/` queda con `admin/` (accesos+sistemas), `help/` (FAQ, guías, contacto —
completo) y `home/` (dashboard). No queda ningún módulo vacío/placeholder pendiente.
