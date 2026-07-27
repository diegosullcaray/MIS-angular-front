> **Documentacion:** [Indice](../../README.md) | [Plan de implementacion](../README.md) | [Estado real](../00-estado-real.md)

# HU-02 — Decidir y alinear el prefijo de rutas (`/admin` doc vs `/inicio` código)

> ✅ **Resuelta el 2026-07-26 como parte de HU-00.** No pudo separarse de HU-00 en la
> práctica: enrutar `accesos/` y `sistemas/` exigía primero resolver bajo qué prefijo
> vivían, porque sus componentes ya tenían `/admin/...` hardcodeado en cada
> `routerLink`/`router.navigate`. Se adoptó `/admin` como canónico. Detalle en
> [`00-estado-real.md`](../00-estado-real.md) y en la nota de cierre de
> [HU-00](./HU-00-estabilizacion-admin-duplicado.md).

**Como** cualquier persona que use la documentación para navegar o probar el sistema,
**quiero** que las rutas documentadas coincidan con las rutas reales, **para** no toparme
con un 404 al seguir el PRD, la guía de UX o los mockups de Figma.

**Tamaño:** S &nbsp;&nbsp; **Prioridad:** 🟠 Alta &nbsp;&nbsp; **Depende de:** HU-00 (para no alinear rutas y luego volver a moverlas)

## Contexto

Ver [`00-estado-real.md` § Hallazgo 2](../00-estado-real.md#hallazgo-2--el-prefijo-de-rutas-real-no-coincide-con-la-documentación).
El código usa `/inicio/dashboard`, `/inicio/admin/...`, `/inicio/:remoteName/**`; el PRD,
`02-ux-app-flow.md` y los mockups de `05-referencia/figma/` usan `/admin/dashboard`,
`/admin/accesos/...`, `/admin/sistemas/...`, `/admin/{slug}/...`. Esta HU es, ante todo,
una **decisión** (¿cuál es la canónica?) y después un trabajo mecánico de alinear el lado
que pierda.

## Alcance

**Sí incluye:**
- Decidir con el dueño de producto cuál prefijo es el definitivo (`/admin` o `/inicio`).
- Aplicar esa decisión: o renombrar los paths en `app.routes.ts`, o corregir
  `02-ux-app-flow.md` + el PRD + los mockups Figma para que digan `/inicio`.
- Actualizar cualquier breadcrumb, guard o test (de HU-01) que asuma el prefijo viejo.

**No incluye:** cambiar la estructura de módulos (eso ya lo resolvió HU-00) — esta HU
solo toca el segmento de URL.

## Pasos

- [ ] Confirmar la decisión de prefijo (por defecto, si no hay preferencia de negocio,
      se recomienda `/admin` porque es el que usan PRD + UX flow + los 3 mockups Figma —
      cambiar 1 archivo de código es más barato que corregir 4 documentos).
- [ ] Si se elige `/admin`: renombrar en `app.routes.ts` el segmento `path: 'inicio'` →
      `path: 'admin'` y `redirectTo: 'inicio/dashboard'` → `redirectTo: 'admin/dashboard'`;
      revisar cualquier lugar que arme URLs a mano (`SidebarComponent`,
      `HeaderComponent` breadcrumb).
- [ ] Si se elige `/inicio`: actualizar `01-canon/02-ux-app-flow.md` §2 (tabla de rutas),
      `01-canon/01-prd.md` y las URL-bars de los mockups en `05-referencia/figma/`.
- [ ] Actualizar los tests de HU-01 que referencien rutas literales.

## Criterios de aceptación

- Dado el mapa de rutas de `02-ux-app-flow.md` §2, cuando se navega a cada ruta listada
  en el navegador, entonces ninguna devuelve 404.
- No quedan referencias al prefijo descartado en `src/app` ni en `docs/01-canon/`.

## Archivos afectados

- `src/app/app.routes.ts`
- `docs/01-canon/02-ux-app-flow.md` (si se elige `/inicio`)
- `docs/01-canon/01-prd.md` (si se elige `/inicio`)
- `docs/05-referencia/figma/*.html` (si se elige `/inicio`)
