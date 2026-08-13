# 05 — Arquitectura Real del Frontend (código actual)
> **Proyecto:** MIS - Management Information System
> **Documentacion:** [Indice](../README.md) | [Vision](../01-canon/00-vision-producto.md)
> **Versión:** 1.0.0
> **Fecha:** 2026-08-12

## 0. Qué es este documento

Este documento describe lo que el código **realmente hace hoy**: los módulos bajo
`pages/modules/*` (Actividades, Dashboard, Incentivos, Presupuesto, Reportes, etc.) son
rutas Angular cargadas de forma diferida (`loadChildren`) **dentro de la misma aplicación**,
migradas 1:1 desde el sistema legado STG (`stg-app-mis-r22`), y hablan directamente con el
backend legado **Ant** mediante el protocolo **Winder**. `core/federation/` existe como
carpeta reservada para cuando se active la integración de sistemas hijos externos, pero no
está en uso todavía.

---

## 1. Punto de entrada: de `index.html` a la primera pantalla

```
main.ts
  └─ bootstrapApplication(App, appConfig)     src/main.ts
       └─ appConfig                            app/app.config.ts
            ├─ provideZonelessChangeDetection()   sin zone.js (obligatorio en todo el proyecto)
            ├─ provideRouter(APP_ROUTES, withComponentInputBinding())
            ├─ provideHttpClient(withFetch(), withInterceptors([authInterceptor, httpErrorInterceptor]))
            ├─ provideOAuthClient()               Google Sign-In (angular-oauth2-oidc)
            ├─ provideAppInitializer(() => AuthService.restaurarSesion())   ← antes del primer render
            ├─ provideAppInitializer(() => ThemeService)                   ← evita parpadeo de tema
            └─ providePrimeNG({ theme: MisTheme })
```

Los dos `provideAppInitializer` son la clave del arranque: `restaurarSesion()` lee
`sessionStorage['mis.sesion']` y repuebla `ShellStateService` **antes** de que el router
resuelva la primera ruta, para que `authGuard` no expulse al usuario en un refresh de
página. `app.global.ts` define las constantes de sesión (`SESSION_KEY = 'mis.sesion'`,
`DURACION_SESION_MS = 15 min`).

---

## 2. Cómo se ingresa: login → guards → shell

```
Usuario en "/"  ──►  redirectTo 'app/dashboard'  ──►  authGuard (core/guards/auth.guard.ts)
                                                            │
                                        ¿shell.usuarioActivo() !== null?
                                        │ no                         │ sí
                                        ▼                             ▼
                              redirectTo '/login'            ShellLayoutComponent (children: módulos)
```

1. **`LoginComponent`** (`pages/full-pages/auth/components/login`) dispara
   `AuthService.iniciarLoginGoogle()` → `oauthService.initImplicitFlow()` (Google Sign-In).
2. Google redirige de vuelta con el ID token; `AuthService.completarLoginGoogle()` extrae
   el email de los claims (o usa `environment.devUser` en desarrollo) y llama a
   `autenticar()`.
3. `autenticar()` pide el perfil al backend legado con
   `ModSysLoginService.login(email)` (un `AntService` — ver §4), mapea la respuesta a
   `UsuarioActivo` (`core/interfaces/shell-state.model.ts`), guarda el token en un signal
   privado y **publica el usuario en `ShellStateService.setUsuarioActivo()`**.
4. La sesión se persiste en `sessionStorage['mis.sesion']` con expiración
   (`DURACION_SESION_MS`); un `setTimeout` interno cierra la sesión sola al vencer.
5. `authGuard` (rutas bajo `/app/**`) y `roleGuard('rol-mínimo')` (rutas administrativas)
   leen `ShellStateService.usuarioActivo()` — nunca el token directamente — para decidir si
   dejan pasar, y usan `router.createUrlTree(...)` para redirigir sin recargar la página.
6. `authInterceptor` (`core/interceptors/auth.interceptor.ts`) adjunta
   `Authorization: Bearer <token>` + `X-User-Role` solo a peticiones al backend Host
   (`/api/v1/*`, aún no implementado en producción); las peticiones al backend Ant no
   llevan Bearer porque el protocolo Winder cifra su propia autenticación (§4). Un 401 del
   Host fuerza `AuthService.cerrarSesion()`.

---

## 3. Estructura de carpetas de `src/app`

```
app/
├── app.config.ts / app.routes.ts / app.ts / app.global.ts   arranque y rutas raíz
├── core/                     código transversal, sin UI de negocio
│   ├── guards/                 authGuard, roleGuard(rol)
│   ├── interceptors/           authInterceptor, httpErrorInterceptor
│   ├── interfaces/              UsuarioActivo, MenuItemActivo, RolSlug (contrato del shell)
│   ├── services/                ShellStateService, CypherService, ThemeService
│   ├── winder/                  cliente del protocolo Winder/Ant — ver §4
│   ├── design-system/           theme tokens compartidos
│   └── federation/               reservado para Native Federation (sin uso aún, ver §0)
├── pages/
│   ├── full-pages/              pantallas fuera del shell autenticado
│   │   ├── auth/                   login, AuthService, modelos de sesión
│   │   ├── error/                   páginas /error/:code
│   │   └── layout/                  ShellLayoutComponent (sidebar + header + <router-outlet>)
│   └── modules/                 un directorio POR MÓDULO DE NEGOCIO — ver §5
├── shared/                    reutilizable entre módulos, sin lógica de negocio propia
│   ├── services/                 p.ej. ToastService
│   ├── ui/                       componentes de presentación (list-skeleton, inline-error…)
│   └── utils/                    funciones puras (formato.util.ts, dom.util.ts)
└── theme/                     preset PrimeNG (MisTheme)
```

**Regla de dependencia:** `pages/modules/*` puede importar de `core/` y `shared/`; lo
inverso nunca. `shared/` no importa de `pages/modules/*` ni de `core/winder` (evita ciclos y
mantiene `shared/` reusable sin arrastrar el protocolo de datos).

---

## 4. Cómo se obtienen los datos: el protocolo Winder/Ant

Todos los módulos migrados del STG hablan con un backend legado ("Ant") que **no** es REST
convencional: cada request va cifrada dentro de un único parámetro `w`. La cadena de clases
en `core/winder/` oculta ese protocolo detrás de una API de Observables normal:

```
MiModuloService extends AntService        pages/modules/<modulo>/services/<modulo>.service.ts
  │  super({ port, secret, appId })          credenciales del módulo (environment.moduleSecrets)
  │
  ├─ getSimpleResponseString(strand, params, responseName)
  ├─ postSimpleResponseString(strand, params)
  │
  ▼
AntService (core/winder/ant/ant-service.class.ts)
  │  arma un Strand (nombre de acción + payload) y delega a WinderService
  ▼
WinderService (core/winder/winder/winder.service.ts)
  │  serializa los Strands → header 'Winder-Params'
  │  cifra {key, port, id, responseType} con CypherService (AES-128-CBC) → parámetro 'w'
  │  GET  /v1/g?w=<cipher>        POST /v1/p  body {w:<cipher>}       POST archivo /v1/pf
  ▼
RESTService (core/winder/rest/rest.service.ts)
  │  HttpClient plano contra environment.requestConfigRootURL (p.ej. https://stg.confianza.pe/cores2/ant)
  ▼
Backend Ant (legado, fuera de este repo)
```

**Patrón que sigue cada servicio de módulo** (ejemplo real, `ActividadesService`):

```typescript
@Injectable({ providedIn: 'root' })
export class ActividadesService extends AntService {
  constructor() {
    super({ port: 6302, secret: environment.moduleSecrets.app, appId: 'app' });
  }

  getRegResultadosDestCred(codBT?: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('actividades.get_dest_cre', { cod_bt: codBT }, 'resultado');
  }
}
```

- Un puerto + secreto por dominio de negocio (`environment.moduleSecrets.*`); cada módulo
  del Host que ya migró tiene su propio `Mod*Service` en `core/winder/instances/` o su
  propio `*.service.ts` dentro de `pages/modules/<modulo>/services/`.
- El nombre del strand (`'actividades.get_dest_cre'`) es el nombre de la acción tal como la
  expone el backend Ant — **no** es una URL REST, así que renombrarlo rompe la integración
  aunque el código Angular compile sin errores.
- La respuesta (`IWinderResponse`) trae el payload dentro de `res.body.resultado...`
  (estructura que decide `responseName`); cada componente hace su propio `as` sobre esa
  forma porque el backend no tiene un contrato tipado — de ahí el patrón repetido
  `const body = res.body as { resultado?: { result?: T[] } } | null;` en los componentes de
  listado.

`httpErrorInterceptor` (`core/interceptors/http-error.interceptor.ts`) es global y
complementario al de auth: resuelve el status de **cualquier** error HTTP (incluidos los del
backend Ant) contra `HttpErrorService` y redirige a `/error/:code` si el error se considera
fatal, salvo que la URL esté en `HTTP_ERROR_IGNORED_URL_PATTERNS`.

---

## 5. Convención de un módulo de negocio (`pages/modules/<modulo>/`)

```
<modulo>/
├── <modulo>.routes.ts        rutas lazy del módulo (loadComponent por vista)
├── components/                pantallas: inyectan el service, tienen loading/error/data signals
│   └── <vista>/
│       ├── <vista>.component.ts
│       ├── <vista>.component.html
│       ├── <vista>.component.css
│       └── <vista>.component.spec.ts
├── ui/                         piezas de presentación reutilizadas SOLO dentro del módulo
│   └── <pieza>/…                (diálogos, tablas, grids — reciben datos por @Input/input())
├── services/                   1 servicio Winder por módulo, extiende AntService
├── models/                     ★ TODAS las interfaces/tipos del módulo van aquí
│   ├── <modulo>.model.ts         las interfaces en sí, con comentario por campo cuando el
│   │                              nombre es un código legado no autoexplicativo (HCODSEC, …)
│   └── index.ts                  barrel: `export type { X, Y } from './<modulo>.model'`
└── utils/                      (opcional) helpers puros específicos del dominio del módulo
```

Componentes de listado siguen el mismo esqueleto (visto en `actividades`, y repetido en la
mayoría de módulos): `loading`/`error`/`data` como signals, `filteredData = computed(...)`
sobre un `globalFilter` signal, `ngOnInit → cargarDatos()`, `protected onSearchInput(event)`
para leer el input de búsqueda. Ese último — leer `(event.target as HTMLInputElement).value`
— está centralizado en `shared/utils/dom.util.ts#inputValue()`; no se debe repetir inline.

### Registro de rutas

Cada `<modulo>.routes.ts` se conecta a `app.routes.ts` con `loadChildren`. El segmento de
URL bajo `app/` no es libre: debe coincidir carácter por carácter con el `act_sec` que
devuelve el backend Ant en `list_sec` (el menú), por eso hay paths que no coinciden con el
nombre de la carpeta (`dashboard` de `home` vs. `dashboards` del módulo `dashboard`,
`incentivos3`, `cons_base_negativa`, etc. — ver comentarios en `app.routes.ts`).

### Interfaces centralizadas en `models/` — estado y pendientes

El módulo `actividades` ya sigue esta convención (limpieza aplicada en esta sesión: se
movieron `ActividadCard` y `NuevoProspecto`, antes declaradas inline en sus componentes, a
`models/actividades.model.ts`). **Pendiente de replicar** en el resto de módulos, que hoy
todavía declaran `interface`/`type` sueltos fuera de `models/` (componentes, servicios o
`utils/`): `reportes`, `presupuesto`, `incentivos`, `framework-esg`, `dashboard`,
`categorizacion`, `analista`. Al abordar cada uno, mover esas interfaces a su
`models/<modulo>.model.ts` y reexportarlas desde `models/index.ts`, igual que en
`actividades`.

---

## 6. Estado compartido Host-wide: `ShellStateService`

Singleton (`core/services/shell-state.service.ts`) con signals privados mutables y
equivalentes públicos `asReadonly()` — el resto de la app (incluidos los futuros Remotes,
§0) solo lee. Guarda `usuarioActivo`, el ítem de menú activo, el estado del sidebar y el
flag de "cerrando sesión". `AuthService` es el único punto de escritura de `usuarioActivo`.

---

## 7. Referencias cruzadas

- Visión de producto: [`00-vision-producto.md`](../01-canon/00-vision-producto.md)
- Funcionalidad del módulo piloto documentado con este mismo criterio: [`actividades/README.md`](../../src/app/pages/modules/actividades/README.md)
