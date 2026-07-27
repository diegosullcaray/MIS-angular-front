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
