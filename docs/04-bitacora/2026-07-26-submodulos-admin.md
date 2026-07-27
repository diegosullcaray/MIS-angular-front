> **Documentacion:** [Indice](../README.md) | [Estado real](../03-plan-implementacion/00-estado-real.md) | [TRD §5.1/§5.3](../01-canon/03-trd.md)

# 2026-07-26 — División de admin/ en usuarios/ + roles/ + sistemas/

Quinta sesión del día, horas después de la fusión `accesos/`+`sistemas/` → `admin/`
([`2026-07-26-migracion-admin-home.md`](./2026-07-26-migracion-admin-home.md)) y de
construir `help/` ([`2026-07-26-modulo-help.md`](./2026-07-26-modulo-help.md)). El usuario
pidió: "el módulo de admin divide en 3 sub módulos de gestión de sistemas, roles, y
usuarios".

## Decisiones confirmadas con el usuario antes de tocar código

1. **Separar también el servicio** — `AccesosService` no queda como fachada compartida:
   se divide en `UsuariosService` y `RolesService`, uno por submódulo.
2. **Eliminar `AccesosShellComponent`, 3 URLs independientes** — no queda una landing
   combinada; `/admin/usuarios`, `/admin/roles` y `/admin/sistemas` son rutas paralelas
   e independientes, cada una con su propio `roleGuard('admin-sistema')`.

## Qué se hizo

### Modelos y servicios divididos

- `admin/usuarios/models/usuario.model.ts` — `Usuario`, `UsuarioRequest`,
  `PageResponse<T>`; importa `RolSlug` desde `../../roles/models/rol.model` (única
  dependencia hacia el submódulo de roles a nivel de modelo).
- `admin/roles/models/rol.model.ts` — `RolSlug`, `Rol`, `RolRequest`, `ROL_LABELS`,
  `ROL_SEVERITY`.
- `admin/usuarios/services/usuarios.service.ts` — `UsuariosService`: signals `usuarios`,
  `totalUsuarios`, `totalUsuariosActivos`, `cargarUsuarios()`, `obtenerUsuario()`,
  `crearUsuario()`, `actualizarUsuario()`, `cambiarEstadoUsuario()`.
- `admin/roles/services/roles.service.ts` — `RolesService`: signals `roles`,
  `isLoadingRoles`, `errorRoles`, `totalRoles`, `cargarRoles()`, `obtenerRol()`,
  `obtenerUsuariosDeRol()` (devuelve `Usuario[]`, tipo importado de `usuarios/`),
  `crearRol()`, `actualizarRol()`, `eliminarRol()`.
- `admin/sistemas/` no cambió de servicio/modelo — solo se reubicó como submódulo
  hermano (ya estaba autocontenido).

### Rutas: de 1 archivo a 3, URLs más cortas

`admin/usuarios/usuarios.routes.ts` (`USUARIOS_ROUTES`) y
`admin/roles/roles.routes.ts` (`ROLES_ROUTES`) reemplazan al antiguo
`admin/accesos.routes.ts`. `app.routes.ts` pasó de una entrada `admin/accesos` a tres
entradas paralelas bajo `admin/`, cada una con su propio `roleGuard('admin-sistema')`:

| Antes | Ahora |
|---|---|
| `/admin/accesos` (`AccesosShellComponent`) | *(eliminada, sin reemplazo)* |
| `/admin/accesos/usuarios/...` | `/admin/usuarios/...` |
| `/admin/accesos/roles/...` | `/admin/roles/...` |
| `/admin/sistemas/...` | sin cambio |

Se eliminó `AccesosShellComponent` (carpeta `admin/components/accesos-shell/` completa)
y los archivos `admin/models/acceso.model.ts`, `admin/services/accesos.service.ts`,
`admin/accesos.routes.ts`, además de los directorios planos viejos
`admin/components/roles/` y `admin/components/usuarios/` (su contenido ya vivía movido
dentro de los submódulos nuevos).

### Dependencias cruzadas legítimas (nuevas, formalizadas en el TRD)

La división expuso que la UI necesita mostrar datos combinados entre los 3 submódulos.
Se mantuvieron como imports explícitos de `services/`+`models/` (nunca de componentes),
la misma clase de excepción que ya aplicaba al layout:

- `UsuarioFormComponent` (en `usuarios/`) inyecta `RolesService` (de `roles/`) para el
  dropdown de asignación de rol — antes usaba el `AccesosService` compartido para lo
  mismo.
- `RolFormComponent` y `RolDetalleComponent` (en `roles/`) inyectan `SistemasService`
  (de `sistemas/`) para mostrar/asignar subsistemas por rol.
- `SistemaDetalleComponent` (en `sistemas/`) inyecta `RolesService` (de `roles/`) para
  listar qué roles tienen acceso a ese sistema.
- `home/components/inicio/inicio.component.ts` pasó de inyectar un único
  `AccesosService` a inyectar `UsuariosService` + `RolesService` por separado para sus
  KPIs de "Usuarios" y "Roles".

Ver la regla actualizada y su excepción documentada en
[`03-trd.md` §5.1](../01-canon/03-trd.md).

### Bug encontrado: import relativo corto en `sistemas/`

Al mover `sistemas-list`, `sistema-form` y `sistema-detalle` de `admin/components/X/`
(plano) a `admin/sistemas/components/X/` (un nivel más anidado), los imports hacia
`shared/ui/*` quedaron cortos por un `../`. Detectado por `tsc` (no por inspección
manual) y confirmado con `grep` antes de aplicar el fix — se corrigió en
`sistemas-list.component.ts` (3 imports: `ListSkeletonComponent`, `EmptyStateComponent`,
`InlineErrorComponent`) y `sistema-detalle.component.ts` (1 import:
`ListSkeletonComponent`).

### Referencias externas actualizadas

Fuera de `admin/`, se corrigieron los imports de: `shell-state.model.ts`,
`role.guard.ts` (+ spec), `fake-db.ts`, `fake-api.interceptor.ts`,
`header.component.ts`, `sidebar.component.ts` (routerLinks del sidebar:
`/admin/accesos/usuarios` → `/admin/usuarios`, `/admin/accesos/roles` → `/admin/roles`)
y `home/components/inicio/inicio.component.ts`/`.html`.

Se verificó `tsc --noEmit`, `ng build` y `ng test --watch=false` en verde antes de dar
la migración por terminada — `ng build` mantiene la única advertencia preexistente de
presupuesto CSS en `sistema-detalle.component.css` (no introducida por este cambio), y
`ng test` se mantiene en 6 archivos / 25 tests, sin regresiones.

## Estado tras esta sesión

- `pages/modules/admin/` ya no es un módulo único: es un contenedor de 3 submódulos
  independientes (`usuarios/`, `roles/`, `sistemas/`), cada uno con su propio
  `services/`, `models/` y archivo de rutas.
- `AccesosService` y `AccesosShellComponent` ya no existen.
- Queda un directorio vacío `admin/components/gestion-usuarios/` que no se pudo borrar
  por un bloqueo de archivo de Windows ("Device or resource busy"); está vacío y no
  afecta la build — pendiente de limpieza manual cuando el bloqueo se libere.
