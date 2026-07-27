> **Documentacion:** [Indice](../README.md) | [Plan de implementacion](../03-plan-implementacion/README.md) | [Estado real](../03-plan-implementacion/00-estado-real.md)

# 2026-07-26 — Ejecución de HU-00 y HU-01

Continuación de [`2026-07-26-analisis-inicial.md`](./2026-07-26-analisis-inicial.md), en
la misma fecha: se ejecutó el backlog empezando por HU-00 (estabilización) y HU-01
(primeros tests), como se decidió que sería el primer paso concreto.

## Descubrimiento en el camino: HU-00 no podía cerrarse sin HU-02

Al ir a montar `accesos.routes.ts` y `sistemas.routes.ts` en `app.routes.ts`, apareció
evidencia que `00-estado-real.md` no había capturado: **todos los `routerLink` y
`router.navigate` internos de `accesos/` y `sistemas/`, el `roleGuard`, el breadcrumb del
header y el sidebar ya asumían el prefijo `/admin/...`**. Solo `app.routes.ts` (y unos
pocos puntos: `login.component.ts`, `not-found.component.html`,
`access-denied.component.html`) usaban `/inicio`. Además, el sidebar tenía rutas de
"Gestión de usuarios/roles/sistemas" (`admin/usuarios/lista-usuarios`, etc.) que no
correspondían a ninguna ruta real configurada en ningún archivo — otro resto muerto del
intento de módulo `admin/`.

Se decidió (sin volver a preguntar, por ser la única opción consistente con el 90% del
código ya escrito) adoptar `/admin` como prefijo canónico. Esto resuelve HU-02 como
efecto colateral necesario, no opcional.

## Bug adicional encontrado: `/inicio/dashboard` nunca llegaba al dashboard

`app.routes.ts` original montaba `INICIO_ROUTES` bajo un segmento anidado
`inicio/inicio` (children: `''` redirect a `'inicio'`, luego `path: 'inicio'` →
`INICIO_ROUTES`), pero el redirect raíz y todos los `router.navigate` apuntaban a
`inicio/dashboard` — un segmento que **no existía** en esa posición. Angular resolvía
`dashboard` contra la ruta comodín `:remoteName/**`, es decir: **cada navegación "al
dashboard" en realidad intentaba cargar un Remote Federation llamado `dashboard`**, que
por supuesto no existe en `federation.manifest.json`. Se corrigió aplanando la estructura:
`admin/dashboard` monta `INICIO_ROUTES` directamente, sin el nivel intermedio.

## Qué se cambió (HU-00 + HU-02 fusionadas)

- Eliminado `src/app/pages/modules/admin/` completo (scaffold vacío + `admin.routes.ts`
  roto) y el archivo suelto `src/app/pages/modules/inicio/components/dd`.
- `src/app/app.routes.ts`: segmento padre `inicio` → `admin`; `dashboard` monta
  `INICIO_ROUTES` directamente (sin el nivel `inicio/inicio` redundante); se agregaron
  las rutas `accesos` y `sistemas` (ambas con `roleGuard('admin-sistema')`) apuntando a
  los módulos reales.
- Corregido el prefijo `/inicio/dashboard` → `/admin/dashboard` en: `role.guard.ts`,
  `login.component.ts`, `header.component.ts` (`breadcrumbHome`), `not-found.component.html`,
  `access-denied.component.html`.
- `sidebar.component.ts`: "Mi espacio" → `/admin/dashboard`; las 3 rutas de "Accesos
  [Admin]" (que apuntaban a URLs inexistentes) corregidas a `/admin/accesos/usuarios`,
  `/admin/accesos/roles`, `/admin/sistemas`.
- Verificado con `npm run build`: compila sin errores (queda un warning preexistente de
  presupuesto de CSS en `sistema-detalle.component.css`, no relacionado con este cambio).

## Qué se hizo (HU-01)

- El proyecto tenía `tsconfig.spec.json` (con tipos `vitest/globals`) pero **ningún
  target `test` en `angular.json`** — `ng test` no tenía builder que ejecutar.
- Se agregó el target `test` (`@angular/build:unit-test`, runner `vitest`,
  `buildTarget: mis-host:esbuild:development`) y se instalaron `vitest` y `jsdom` como
  devDependencies (son peer dependencies de `@angular/build` para el runner Vitest, no
  venían instalados).
- 5 archivos de spec nuevos, 24 tests, todos en verde:
  - `core/services/shell-state.service.spec.ts`
  - `core/guards/auth.guard.spec.ts`
  - `core/guards/role.guard.spec.ts` (incluye caso de regresión directa de H-03 del
    sistema anterior: que los permisos no se acumulen entre usuarios)
  - `core/federation/remote-wrapper/remote-wrapper.component.spec.ts` (3 estados +
    descarte de respuesta tardía al cambiar de remote)
  - `pages/full-pages/auth/service/auth.service.spec.ts`

## Hallazgo colateral, no corregido

`npm install` falla sin `--legacy-peer-deps`: `primeng@21.1.9` exige
`@angular/cdk@^21.0.0` como peer, pero el proyecto fija `@angular/cdk@^22.0.4`. No se
tocó — es una decisión de versiones (subir `primeng` cuando exista una versión compatible
con Angular 22, o confirmar que `--legacy-peer-deps` es aceptable de forma permanente)
que le corresponde a quien mantiene las dependencias del proyecto, no a esta HU.

## Estado tras esta sesión

HU-00, HU-01 y HU-02 cerradas. Backlog actualizado en
[`03-plan-implementacion/README.md`](../03-plan-implementacion/README.md). Próximo paso
sugerido: HU-03 (Dockerización) o, si hay equipo de backend disponible en paralelo,
adelantar HU-04.
