> **Documentacion:** [Indice](../README.md) | [Estado real](../03-plan-implementacion/00-estado-real.md) | [TRD §5.3](../01-canon/03-trd.md)

# 2026-07-26 — Fusión de accesos/+sistemas/ en admin/, e inicio/ → home/

Cuarta sesión del día. El usuario agregó 3 carpetas nuevas en `pages/modules/`:
`admin/` (con los mismos 3 scaffolds vacíos `gestion-usuarios`/`gestion-roles`/
`gestion-sistemas` que HU-00 había eliminado — esta vez a propósito), `help/` (vacío) y
`home/` (con un componente `InicioComponent` vacío, duplicando el nombre del dashboard
real). Pidió actualizar la documentación y "quitar los módulos que no se usarán".

## Decisiones confirmadas con el usuario antes de tocar código

Dado el riesgo de repetir el error de HU-00 (borrar lo que funciona a favor de un
scaffold vacío) o de dejar la app rota, se confirmaron 3 cosas antes de mover nada:

1. **`admin/` sí va a reemplazar a `accesos/` y `sistemas/`** — no es un módulo distinto.
2. **`home/` reemplaza a `inicio/`** (mismo dashboard, no son pantallas distintas).
3. **`help/` es para ayuda/soporte/FAQ** — sus "3 componentes primordiales" quedan como
   scaffold vacío hasta que se construyan.
4. El reemplazo de `accesos/`+`sistemas/` se hace **migrando el código real primero,
   verificando que compile, y recién después borrando** — nunca dejar la app sin
   gestión de usuarios/roles/sistemas a mitad de camino.

## Qué se hizo

### `inicio/` → `home/`

Se copió el componente real (`InicioComponent`: KPIs, tabla de estado de Remotes,
wiring a `ShellStateService`/`SistemasService`/`AccesosService`) sobre el stub vacío de
`home/components/inicio/`, se creó `home/home.routes.ts` (antes `HOME_ROUTES`,
`INICIO_ROUTES`), se reenrutó `app.routes.ts` y se borró `pages/modules/inicio/`. De
paso se corrigió un bug menor: el template usaba el ícono `lucideServer` que no estaba
registrado en `provideIcons()` del componente original — se agregó al portar.

### `accesos/` + `sistemas/` → `admin/`

Se movió el contenido real (no los stubs `gestion-*`, que se descartaron por estar
vacíos) a una estructura plana dentro de `admin/`:

```
admin/
├── accesos.routes.ts       (antes accesos/accesos.routes.ts)
├── sistemas.routes.ts      (antes sistemas/sistemas.routes.ts)
├── models/
│   ├── acceso.model.ts
│   └── sistema.model.ts
├── services/
│   ├── accesos.service.ts
│   └── sistemas.service.ts
└── components/
    ├── accesos-shell/, roles/, usuarios/       (antes en accesos/components/)
    └── sistemas-list/, sistema-form/, sistema-detalle/  (antes en sistemas/components/)
```

Se mantuvo la misma profundidad de carpetas relativa a `pages/modules/` (solo se
renombró el módulo padre de `accesos`/`sistemas` a `admin`), así que los imports hacia
`core/`/`shared/` no necesitaron ajuste — **excepto** los que cruzaban entre `accesos/`
y `sistemas/` directamente, que sí existían:

- `rol-detalle.component.ts`, `rol-form.component.ts`, `usuario-form.component.ts`
  (en `accesos/`) importaban `SistemasService` de `sistemas/`.
- `sistema-detalle.component.ts` (en `sistemas/`) importaba `AccesosService` y `Rol` de
  `accesos/`.

Esto era, en los hechos, **una violación ya existente** de la regla de aislamiento del
TRD §5.1 (los módulos de negocio no deberían importarse entre sí) — nadie la había
notado porque no rompía nada, solo acoplaba silenciosamente los dos módulos. Al
fusionarlos en uno solo, esos imports pasan a ser intra-módulo y la violación
desaparece sola.

Además se corrigieron los imports de 8 archivos **fuera** de estos módulos que
referenciaban `accesos/`/`sistemas/` por su ruta vieja: `fake-db.ts`,
`fake-api.interceptor.ts`, `shell-state.model.ts`, `role.guard.ts` (+ su spec),
`auth.service.ts` (+ su spec), `header.component.ts`, `sidebar.component.ts`, y
`home/components/inicio/inicio.component.ts`. Y `app.routes.ts`: las rutas
`/admin/accesos` y `/admin/sistemas` ahora cargan desde
`./pages/modules/admin/accesos.routes` y `.../admin/sistemas.routes` — **la URL no
cambió**, solo de dónde viene el código.

Se verificó `tsc --noEmit`, `ng build` y `ng test` en verde **antes** de borrar
`accesos/` y `sistemas/`, y otra vez después. En ningún momento la app quedó en un
estado que no compilara.

## Estado tras esta sesión

- `pages/modules/` queda con 3 carpetas: `admin/` (accesos + sistemas, unificado),
  `help/` (planeado, vacío), `home/` (dashboard, antes `inicio/`).
- `accesos/`, `sistemas/` e `inicio/` ya no existen.
- `help/` sigue sin contenido — es el próximo trabajo pendiente del usuario, no de esta
  sesión.
