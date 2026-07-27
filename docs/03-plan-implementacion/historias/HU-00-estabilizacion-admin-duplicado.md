> **Documentacion:** [Indice](../../README.md) | [Plan de implementacion](../README.md) | [Estado real](../00-estado-real.md)

# HU-00 — Eliminar el módulo `admin/` duplicado y enrutar `accesos/` + `sistemas/`

> ✅ **Resuelta el 2026-07-26.** Ver [`../../04-bitacora/2026-07-26-hu00-hu01-ejecucion.md`](../../04-bitacora/2026-07-26-hu00-hu01-ejecucion.md)
> para el diff-por-diff. Al ejecutarla se descubrió que no podía cerrarse sin decidir
> también el prefijo de rutas (HU-02): todos los `routerLink` internos de `accesos/` y
> `sistemas/`, el guard de roles, el header y el sidebar ya asumían `/admin/...` — solo
> `app.routes.ts` usaba `/inicio`. Se adoptó `/admin` como prefijo canónico (por ser el
> que documentan PRD/UX-flow/Figma y el que ya usaba el 90% del código), lo que también
> cierra HU-02. También se corrigió un bug adicional encontrado en el camino: la ruta
> `/inicio/dashboard` no llegaba nunca al dashboard real — la capturaba el comodín
> `:remoteName/**`, porque el dashboard estaba anidado un nivel de más
> (`inicio/inicio/dashboard`) mientras el redirect apuntaba a `inicio/dashboard`.

**Como** administrador del sistema, **quiero** que `/admin/...` cargue la gestión
real de usuarios, roles y sistemas (no un scaffold vacío), **para** poder usar el IAM y
el registro de MFEs que ya están construidos.

**Tamaño:** M &nbsp;&nbsp; **Prioridad:** 🔴 Bloqueante &nbsp;&nbsp; **Depende de:** ninguna

## Contexto

Ver evidencia completa en [`00-estado-real.md` § Hallazgo 1](../00-estado-real.md#hallazgo-1--módulo-admin-duplica-a-accesos-y-sistemas).
En resumen: `pages/modules/admin/` es un scaffold vacío y roto que sí está enrutado;
`pages/modules/accesos/` y `pages/modules/sistemas/` son módulos completos que no están
enrutados en ningún lado. Es el mismo patrón "fork en vez de parametrizar" que el sistema
anterior repitió con `incentivos2/3/4` y `stg-table/2/3/4`.

## Alcance

**Sí incluye:**
- Eliminar por completo `src/app/pages/modules/admin/` (los tres componentes scaffold y
  `admin.routes.ts`).
- Eliminar el archivo suelto `src/app/pages/modules/inicio/components/dd`.
- Registrar `accesos.routes.ts` y `sistemas.routes.ts` como rutas hijas reales bajo el
  layout (reemplazando la entrada `admin` en `app.routes.ts`).
- Verificar que `roleGuard('admin-sistema')` sigue protegiendo ambas rutas.

**No incluye:**
- Cambiar el prefijo `/inicio` por `/admin` — eso es HU-02, una decisión de negocio
  distinta (qué URL es la canónica), no una limpieza de duplicado.
- Escribir tests nuevos — eso es HU-01. Si HU-01 ya está cerrada al llegar aquí, esta HU
  sí debe extender esos tests para cubrir las rutas que quedan activas.
- Tocar el contenido interno de `accesos/` o `sistemas/` — ya están construidos y no se
  tocan salvo que el enrutado revele un bug.

## Pasos

- [ ] Confirmar (búsqueda de referencias) que ningún otro archivo importa algo de
      `pages/modules/admin/` antes de borrar.
- [ ] Borrar `src/app/pages/modules/admin/` completo.
- [ ] Borrar `src/app/pages/modules/inicio/components/dd`.
- [ ] En `app.routes.ts`, reemplazar la entrada `path: 'admin'` (que hoy apunta a
      `admin.routes`) por dos entradas hijas bajo `inicio`: `accesos` → `accesos.routes.ts`
      y `sistemas` → `sistemas.routes.ts`, cada una con
      `canActivate: [roleGuard('admin-sistema')]`.
- [ ] Actualizar el menú/sidebar (`SidebarNavPanelComponent` / `ShellStateService`) si
      referenciaba la ruta `admin` por nombre.
- [ ] `npm run build` sin errores de compilación.

## Criterios de aceptación

- Dado un usuario con rol `admin-sistema`, cuando navega a la ruta de usuarios, entonces
  ve `UsuariosListComponent` con datos reales de la Fake API (no una pantalla en blanco).
- Dado un usuario con rol `supervisor-area`, cuando intenta navegar a la ruta de
  sistemas, entonces `roleGuard` lo redirige a `/inicio/dashboard` con un toast de
  "Acceso denegado" (MSG-02).
- `grep -r "modules/admin" src/app` no devuelve resultados.
- `npm run build` termina sin errores ni advertencias de módulos faltantes.

## Archivos afectados

- Eliminar: `src/app/pages/modules/admin/**`, `src/app/pages/modules/inicio/components/dd`
- Modificar: `src/app/app.routes.ts`
- Verificar sin cambios: `src/app/pages/modules/accesos/accesos.routes.ts`,
  `src/app/pages/modules/sistemas/sistemas.routes.ts`
