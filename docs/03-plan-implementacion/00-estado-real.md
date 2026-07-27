> **Documentacion:** [Indice](../README.md) | [Plan de implementacion (HU)](./README.md)

# 00 — Estado real del código (auditoría 2026-07-26)

> Documento del canon de este plan. Se escribe una vez a partir de evidencia y se
> actualiza solo cuando el hallazgo deja de ser cierto. No es una bitácora de sesión — eso
> vive en [`../04-bitacora/`](../04-bitacora/).
>
> **Actualización 2026-07-26 (misma fecha, tras ejecutar HU-00 y HU-01):** los Hallazgos
> 1, 2 y 4 quedaron resueltos y el Hallazgo 3 tiene ya una primera red de tests. El
> detalle de qué se encontró y qué se hizo vive en
> [`../04-bitacora/2026-07-26-hu00-hu01-ejecucion.md`](../04-bitacora/2026-07-26-hu00-hu01-ejecucion.md).
> Esta sección se conserva **como evidencia histórica** de por qué el backlog priorizó
> estabilizar antes que sumar — no se reescribe en pasado para no perder el rastro de qué
> tan mal estaba realmente.

`00-plan-fases-original.md` (el plan heredado, ver [nota histórica](./README.md#plan-anterior-por-fases))
marcaba las Fases 0–5 como `✅ COMPLETADA`. Esta auditoría compara esa afirmación contra
`src/app` línea por línea. Conclusión: **el frontend del Host está construido en un ~80%,
pero no está todo enrutado, y hay una rama de código duplicada y rota compitiendo con el
trabajo bueno.** Es el mismo patrón que el análisis del sistema anterior llamó "forkear en
vez de parametrizar" (ver [`../06-legado-sistema-anterior/01-analisis/01-arquitectura.md`](../06-legado-sistema-anterior/01-analisis/01-arquitectura.md#6-el-patrón-de-ui-configuración-declarativa)).

---

## Hallazgo 1 — Módulo `admin/` duplica a `accesos/` y `sistemas/`

| | Módulo huérfano y roto: `pages/modules/admin/` | Módulo completo y sin enrutar: `pages/modules/accesos/` + `pages/modules/sistemas/` |
|---|---|---|
| Estado | Scaffold vacío (`ng generate` sin terminar) | CRUD completo: modelos, servicios con signals, Signal Forms, tablas, pestañas |
| Evidencia | `admin/components/gestion-usuarios/gestion-usuarios.component.ts` — clase vacía `export class GestionUsuariosComponent {}` sin imports de servicio ni template real. Igual `gestion-roles` y `gestion-sistemas`. | `accesos/services/accesos.service.ts`, `accesos/components/usuarios/usuario-form/...`, `sistemas/services/sistemas.service.ts`, `sistemas/components/sistema-detalle/...` |
| ¿Está enrutado? | **Sí** — `app.routes.ts` → `inicio/admin` → `admin.routes.ts` | **No** — `accesos.routes.ts` y `sistemas.routes.ts` no aparecen importados en ningún otro archivo del proyecto (verificado por búsqueda de texto) |

Es decir: la ruta que el usuario final puede navegar hoy (`/inicio/admin/...`) apunta al
scaffold vacío, mientras el trabajo real y completo (`accesos/`, `sistemas/`) es código
muerto sin ruta que lo active.

### Evidencia del import roto

`src/app/pages/modules/admin/admin.routes.ts`:

```typescript
export const ADMIN_ROUTES: Routes = [
  {
    path: 'usuarios',
    loadComponent: () =>
      import('.gestion-usuarios/gestion-usuarios.component').then(
        (m) => m.Ges
      )
  },
];
```

Dos errores independientes, cualquiera de los dos rompe la compilación si esta ruta se
activa:
1. `'.gestion-usuarios/...'` — falta el `/` después del `.` (debería ser
   `'./gestion-usuarios/gestion-usuarios.component'`).
2. `m.Ges` — el nombre real exportado es `GestionUsuariosComponent`; `Ges` no existe en el
   módulo.

Solo hay una ruta declarada (`usuarios`) — faltan `roles` y `sistemas` en
`admin.routes.ts`, aunque sus componentes scaffold sí existen en disco.

---

## Hallazgo 2 — El prefijo de rutas real no coincide con la documentación

El PRD y el doc `02-ux-app-flow.md` documentan `/admin/dashboard`, `/admin/accesos/...`,
`/admin/sistemas/...`, `/admin/:remoteName/**`. El código real (`app.routes.ts`) usa:

```
/inicio                      ← ShellLayoutComponent (no /admin)
/inicio/inicio | /inicio/dashboard   → INICIO_ROUTES (ambos cargan el mismo InicioComponent)
/inicio/admin                → ADMIN_ROUTES (el módulo roto del Hallazgo 1)
/inicio/:remoteName/**       → RemoteWrapperComponent
```

No hay una ruta `/admin` en absoluto en `app.routes.ts`. Esto no es solo un detalle de
nomenclatura: cualquier enlace, breadcrumb o prueba manual que siga la documentación
actual (`/admin/sistemas`, `/admin/accesos/usuarios`) da **404**. Ver HU-02.

---

## Hallazgo 3 — Cero red de pruebas

```
$ find src/app -name "*.spec.ts" | wc -l
0
```

Ningún componente, servicio o guard tiene test. Es la misma condición que hizo tan
arriesgado refactorizar el sistema anterior (28 specs sobre 941 archivos `.ts` — ver
[`../06-legado-sistema-anterior/03-referencia/metricas.md`](../06-legado-sistema-anterior/03-referencia/metricas.md)),
solo que aquí el proyecto es nuevo y todavía no hay ninguna. Es más barato empezar ahora
que después de HU-00/HU-02. Ver HU-01.

---

## Hallazgo 4 — Basura suelta

`src/app/pages/modules/inicio/components/dd` — archivo de 0 bytes sin extensión, no
referenciado por ningún import. Se elimina como parte de HU-00.

---

## Lo que sí está bien (y por qué no hay que tocarlo)

- `ShellStateService`, guards (`authGuard`, `roleGuard`), `RemoteWrapperComponent`,
  `AuthService` + flujo MFA, design tokens (`tokens.css`) y el preset PrimeNG (`mis-theme.ts`)
  están implementados según el TRD, sin atajos ni `any` que se hayan encontrado en esta
  auditoría.
- `accesos/` y `sistemas/` (los módulos huérfanos) están **bien construidos** — el
  problema no es su calidad, es que nadie los conectó. Activarlos es más barato que
  reescribirlos.
- `tsconfig.json` mantiene `strict: true` — a diferencia del legado, aquí el tipado nunca
  estuvo apagado.

---

## Resumen para quien retome esto

| Hallazgo | Severidad | HU que lo cierra | Estado |
|---|---|---|---|
| `admin/` duplica y compite con `accesos/`+`sistemas/`, import roto | 🔴 Bloqueante | [HU-00](./historias/HU-00-estabilizacion-admin-duplicado.md) | ✅ Resuelto 2026-07-26 |
| Cero tests | 🔴 Bloqueante para tocar código con confianza | [HU-01](./historias/HU-01-red-de-seguridad-tests.md) | ✅ 24 tests en verde, 2026-07-26 |
| Rutas reales (`/inicio/...`) no coinciden con la doc (`/admin/...`) | 🟠 Alto | [HU-02](./historias/HU-02-alinear-rutas-admin-vs-inicio.md) | ✅ Resuelto como parte de HU-00 |
| Archivo suelto `dd` | 🟢 Trivial | Incluido en HU-00 | ✅ Eliminado |

El próximo hallazgo abierto es la falta de un target `test` en `angular.json` — ya
corregido también al ejecutar HU-01 — y el mismatch de peer dependencies
`primeng@21.1.9` (pide `@angular/cdk@^21`) contra `@angular/cdk@^22.0.4` del proyecto,
que obligó a instalar con `--legacy-peer-deps`. Este último no se tocó: es una decisión
de versiones que requiere confirmar con quien mantiene el `package.json` si se sube
`primeng` o se fija `@angular/cdk` a la misma major.

---

## Actualización 2026-07-26 (misma fecha) — reorganización de módulos

Se recreó `admin/` con los mismos 3 scaffolds vacíos que HU-00 había eliminado
(`gestion-usuarios`, `gestion-roles`, `gestion-sistemas`) — esta vez **a propósito**:
confirmada la intención de que `admin/` absorba la gestión de usuarios/roles y de
sistemas, se migró de inmediato: se movió el código real de `accesos/` y `sistemas/`
dentro de `admin/` (modelos, servicios y componentes, conservando sus nombres
originales — `accesos-shell`, `roles/`, `usuarios/`, `sistemas-list`, `sistema-form`,
`sistema-detalle` — no los stubs `gestion-*`, que se descartaron por estar vacíos), se
corrigieron los ~15 imports que cruzaban entre los dos módulos originales o que los
referenciaban desde fuera (`fake-db.ts`, `fake-api.interceptor.ts`, `role.guard.ts`,
`auth.service.ts`, `header.component.ts`, `sidebar.component.ts`,
`home/.../inicio.component.ts`, `shell-state.model.ts`), se reenrutó `app.routes.ts` a
`./pages/modules/admin/accesos.routes` y `.../admin/sistemas.routes`, y solo entonces
se borraron las carpetas `accesos/` y `sistemas/`. La app nunca quedó en un estado roto
intermedio — se verificó `tsc`/`build`/`test` en verde antes de cada borrado.

Efecto colateral positivo: `accesos/` y `sistemas/` ya se importaban directamente entre
sí (p. ej. `rol-detalle.component.ts` usaba `SistemasService`) — una violación de la
regla de aislamiento del TRD §5.1. Al fusionarlos en un solo módulo, esos imports pasan
a ser intra-módulo y la regla deja de estar violada.

También se migró `pages/modules/inicio/` → `pages/modules/home/` (mismo componente
`InicioComponent`, mismo rol de dashboard en `/admin/dashboard`, sin cambios de
comportamiento). De paso se corrigió un bug menor encontrado al portar el código:
`lucideServer` se usaba en el template pero no estaba registrado en `provideIcons()`
del componente original.

Más tarde, el mismo día, se construyó `help/` con sus 3 componentes (`FaqComponent`,
`GuiasComponent`, `ContactoComponent`) enrutados en `/admin/help/{faq,guias,contacto}`
— sin `roleGuard`, disponible para cualquier usuario autenticado — y un enlace "Ayuda"
en la sección "Acceso directo" del sidebar. Ver
[`../04-bitacora/2026-07-26-modulo-help.md`](../04-bitacora/2026-07-26-modulo-help.md).

| Hallazgo | Severidad | Estado |
|---|---|---|
| `admin/` reemplaza a `accesos/`+`sistemas/` (fusionados, mismas URLs) | 🟢 Resuelto | ✅ Migrado 2026-07-26 |
| `help/` (FAQ, guías, contacto) | 🟢 Resuelto | ✅ Construido 2026-07-26 |
| `inicio/` → `home/` (rename, sin cambio de comportamiento) | 🟢 Trivial | ✅ Migrado 2026-07-26 |

---

## Actualización 2026-07-26 (mismo día, horas después) — `admin/` se divide en 3 submódulos

La fusión anterior había resuelto la duplicación, pero dejó `admin/` como un módulo único
con dos responsabilidades de negocio distintas (IAM de usuarios/roles, y registro de
sistemas/Remotes) y un único `AccesosService` monolítico. A pedido explícito, se dividió
en **3 submódulos independientes**, cada uno con su propio `services/`, `models/` y
archivo de rutas:

- `admin/usuarios/` — `UsuariosService`, `usuario.model.ts` (`Usuario`, `UsuarioRequest`,
  `PageResponse<T>`), `usuarios.routes.ts` (`USUARIOS_ROUTES`).
- `admin/roles/` — `RolesService`, `rol.model.ts` (`Rol`, `RolSlug`, `RolRequest`,
  `ROL_LABELS`, `ROL_SEVERITY`), `roles.routes.ts` (`ROLES_ROUTES`).
- `admin/sistemas/` — sin cambios de fondo, solo reubicado como submódulo hermano
  (`SistemasService`, `sistema.model.ts`, `sistemas.routes.ts`).

`AccesosService` se eliminó — se dividió en `UsuariosService` y `RolesService` (decisión
confirmada explícitamente, no una interpretación). Se eliminó también
`AccesosShellComponent` (la landing combinada con KPIs de usuarios+roles): ya no hay una
página que una ambas cosas, cada submódulo es una URL independiente.

**Cambio de URLs** (el único cambio de contrato de esta actualización):

| Antes | Ahora |
|---|---|
| `/admin/accesos` (`AccesosShellComponent`) | *(eliminada, sin reemplazo)* |
| `/admin/accesos/usuarios/...` | `/admin/usuarios/...` |
| `/admin/accesos/roles/...` | `/admin/roles/...` |
| `/admin/sistemas/...` | sin cambio |

`app.routes.ts` pasó de una única entrada `admin/accesos.routes` a tres entradas
paralelas (`usuarios`, `roles`, `sistemas`), cada una con su propio `roleGuard('admin-sistema')`.

**Dependencias cruzadas legítimas descubiertas y formalizadas** (ver excepción en
[`03-trd.md` §5.1](../01-canon/03-trd.md)): `usuarios/` y `roles/` no son 100% aislados
entre sí ni de `sistemas/` porque la UI necesita mostrar datos combinados — `UsuarioFormComponent`
lee `RolesService` (dropdown de rol), `RolFormComponent` y `RolDetalleComponent` leen
`SistemasService` (subsistemas asignables a un rol), y `SistemaDetalleComponent` lee
`RolesService` (roles con acceso a ese sistema). Es la misma clase de excepción que ya
aplicaba al layout leyendo services de otros módulos: solo capa `services/`+`models/`,
nunca componentes.

**Bug encontrado y corregido durante la migración**: al anidar los componentes de
`sistemas` un nivel más profundo (`admin/sistemas/components/X/` en vez de
`admin/components/X/`), los imports relativos a `shared/ui/*` en `sistemas-list.component.ts`
y `sistema-detalle.component.ts` quedaron cortos por un `../` — detectado por `tsc`, no
por inspección manual, y confirmado con `grep` antes de dar el fix por bueno.

Verificado en verde tras la migración: `tsc --noEmit` sin salida, `ng build` sin errores
nuevos (persiste una advertencia de presupuesto CSS preexistente en
`sistema-detalle.component.css`, no introducida por este cambio), `ng test --watch=false`
con 6 archivos / 25 tests en verde. Detalle completo en
[`../04-bitacora/2026-07-26-submodulos-admin.md`](../04-bitacora/2026-07-26-submodulos-admin.md).

| Hallazgo | Severidad | Estado |
|---|---|---|
| `admin/` se divide en `usuarios/`+`roles/`+`sistemas/`, `AccesosService` se divide en 2 | 🟢 Resuelto | ✅ Migrado 2026-07-26 |
| `AccesosShellComponent` retirado (sin landing combinada) | 🟢 Trivial | ✅ Eliminado 2026-07-26 |
| Import relativo a `shared/ui/*` corto en 2 componentes de `sistemas/` | 🟢 Trivial | ✅ Corregido 2026-07-26 |
