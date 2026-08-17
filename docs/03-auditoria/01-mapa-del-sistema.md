# Mapa del sistema

Descripción de cómo está construido el MIS Host hoy. Complementa
[`02-arquitectura/05-arquitectura-frontend-actual.md`](../02-arquitectura/05-arquitectura-frontend-actual.md)
con la vista completa de capas, dependencias y puntos de acoplamiento.

## 1. Identidad técnica

El MIS Host es una aplicación Angular 22 de una sola página, sin renderizado en servidor, que
funciona como portal unificado sobre un backend heredado propietario llamado **Ant**, al que se
habla mediante un protocolo propio llamado **Winder**.

Decisiones estructurales ya tomadas:

- **Zoneless.** `provideZonelessChangeDetection()` — no se carga `zone.js`. La detección de
  cambios la disparan las señales, los eventos y el `AsyncPipe`.
- **Standalone.** No hay NgModules. Todo son componentes independientes con `imports` propios.
- **Señales como estado primario.** 305 usos de `signal`/`computed`/`input`/`output` frente a
  116 `subscribe` directos, casi todos concentrados en la frontera HTTP.
- **Carga diferida por módulo de negocio.** Cada entrada de `APP_ROUTES` usa `loadChildren`,
  lo que produce 114 fragmentos diferidos.
- **PWA.** Service worker activo fuera de desarrollo, que cachea únicamente el app-shell.
  `ngsw-config.json` no cachea ninguna respuesta del backend: los datos financieros siempre
  se piden en vivo. Esta decisión es correcta y conviene mantenerla.

## 2. Capas

```
main.ts
  └── bootstrapApplication(App, appConfig)
        │
        ├── app.config.ts ......... composición raíz: router, HttpClient + 3 interceptores,
        │                            OAuth, PrimeNG, service worker, 2 inicializadores
        │
        ├── app.routes.ts ......... /login  ·  /error/:code  ·  /app/** (protegido)  ·  **
        │
        └── ShellLayoutComponent .. cascarón persistente (sidebar + header + router-outlet)
```

### Capa núcleo — `src/app/core/`

| Elemento | Responsabilidad |
|---|---|
| `guards/auth.guard.ts` | Deja pasar si `ShellStateService.usuarioActivo()` no es nulo |
| `guards/role.guard.ts` | Fábrica de guard por rol, con jerarquía `admin-sistema > admin-general > supervisor-area` |
| `interceptors/auth.interceptor.ts` | Enruta por destino: al backend Ant solo aplica un tiempo límite de 30 s; a `/api/v1/*` adjunta `Authorization` y `X-User-Role`; ante un 401 cierra la sesión |
| `interceptors/http-error.interceptor.ts` | Redirige a `/error/:code` cuando el error está clasificado como fatal |
| `interceptors/loading.interceptor.ts` | Enciende el overlay global en toda petición, sin excepción |
| `services/shell-state.service.ts` | Estado compartido del cascarón. Señales privadas mutables + `asReadonly()` público |
| `services/cypher.service.ts` | AES-128-CBC implementado a mano en JavaScript (302 líneas) |
| `winder/` | Cliente del protocolo del backend Ant |

### El protocolo Winder

Tres clases encadenadas, cada una con una responsabilidad clara:

```
ModXxxService (extiende AntService)   declara puerto + secreto + appId del módulo
        │
        ▼
AntService                            arma los Strand y expone helpers de negocio
        │
        ▼
WinderService                         serializa los Strand en el header `Winder-Params`,
        │                             cifra {key, port, id, responseType} en el parámetro `w`
        ▼
RESTService → HttpClient              GET /v1/g?w=…  ·  POST /v1/p  ·  POST /v1/pf (archivos)
```

Los nueve módulos Ant registrados y sus puertos:

| Servicio | Puerto | `appId` | Secreto |
|---|---|---|---|
| `ModSysLoginService` | 6300 | `session` | `moduleSecrets.session` |
| `ModSysAdminService` | 6301 | `admin` | `moduleSecrets.admin` |
| `ModDashboardService` | 6302 | `app` | `moduleSecrets.app` |
| `ModFrameworkEsgService` | 6302 | `app` | `moduleSecrets.app` |
| `ModIncentivosService` | 6302 | `app` | `moduleSecrets.app` |
| `ModKaypachaService` | 6302 | `app` | `moduleSecrets.app` |
| `ModPresupuestoService` | 6302 | `app` | `moduleSecrets.app` |
| `ModSeccionesService` | 5301 | `secciones` | `moduleSecrets.secciones` |
| `ModReportesService` | 5304 | `reporting` | `moduleSecrets.reporting` |

El diseño en capas es bueno: los componentes nunca ven el protocolo. El problema no está en
la forma sino en el modelo de confianza, descrito en los hallazgos C-2 y C-3.

## 3. Flujo de autenticación

```
LoginComponent
   └─ AuthService.iniciarLoginGoogle()      flujo implícito de OAuth contra accounts.google.com
         └─ regreso a redirectUri
              └─ completarLoginGoogle()
                   ├─ oauthService.tryLogin() y validación del id_token
                   ├─ email = devUser (si !production) ó claims['email']   ← ver hallazgo C-1
                   └─ autenticar(email)
                        ├─ ModSysLoginService.login(email)   → puerto 6300 del backend Ant
                        ├─ token = lr.sid || lr.token || 'winder-session-token'  ← ver C-4
                        ├─ rol = profile.tip_use === 0 ? 'admin-sistema' : 'supervisor-area'
                        ├─ ShellStateService.setUsuarioActivo(...)
                        └─ persistir en sessionStorage con caducidad de 15 min
```

Al recargar la página, `provideAppInitializer` llama a `restaurarSesion()` antes del primer
render, lee `sessionStorage`, comprueba la caducidad y reprograma el temporizador. Es la
razón por la que `authGuard` no expulsa al usuario en un refresco, y está bien resuelto.

También existe un modo de **usuario alterno**: un supervisor puede operar como uno de sus
colaboradores (`altLogin`), guardando el usuario original para poder volver.

## 4. Inventario de módulos de negocio

Doce módulos bajo `src/app/pages/modules/`, todos con carga diferida:

| Módulo | Ruta | Notas |
|---|---|---|
| `home` | `/app/dashboard` | "Mi espacio". Ojo: el nombre de la ruta no coincide con la carpeta |
| `dashboard` | `/app/dashboards` | Dashboards integrados con Power BI |
| `analista` | `/app/analista` | Solo se migraron Principal y Listas |
| `categorizacion` | `/app/analista/categorizacion` | Debe declararse antes que `analista` en el router |
| `actividades` | `/app/actividades` | Destino de crédito, prospectos y transacciones de corresponsal |
| `herramientas` | `/app/cons_base_negativa` | Consulta de base negativa |
| `presupuesto` | `/app/presupuesto` | |
| `incentivos` | `/app/incentivos3` | Solo la tercera generación |
| `framework-esg` | `/app/esg` | |
| `kaypacha` | `/app/Kaypacha__` | |
| `ranking-k` | `/app/ranking-k` | |
| `reportes` | `/app/reportes` | El más grande: 249 archivos |

Los segmentos de ruta no son libres: cada uno debe coincidir carácter por carácter con el
`act_sec` que devuelve `list_sec` del backend. Esto está bien documentado en `app.routes.ts`,
pero es un acoplamiento fuerte con el backend heredado que conviene tener presente.

### Convención de módulo

Todos los módulos siguen la misma estructura, lo que hace el código muy predecible:

```
<modulo>/
├── <modulo>.routes.ts      rutas diferidas
├── components/             pantallas conectadas a servicios
├── ui/                     componentes de presentación (diálogos, tablas)
├── services/               fachada de negocio sobre los servicios Winder
├── models/                 tipos e interfaces
└── utils/                  funciones puras
```

## 5. Capa compartida — `src/app/shared/`

Pequeña y sana: `DataTableComponent` (tabla genérica con filtrado y búsqueda),
`EmptyStateComponent`, `InlineErrorComponent`, `ListSkeletonComponent`,
`LoadingOverlayComponent`, `RedirectOverlayComponent`, más los servicios `ToastService`,
`LoadingService`, `DriverTourService` y `RedirectOverlayService`.

## 6. Dependencias de terceros

| Paquete | Uso | Riesgo |
|---|---|---|
| `primeng` 21.1.9 + `@primeuix/themes` | Biblioteca de componentes | Fijada a versión exacta con `overrides` para forzar Angular 22. Frágil ante actualizaciones |
| `powerbi-client` + `powerbi-client-angular` | Informes embebidos | Único CommonJS permitido. Aporta 234 kB al fragmento diferido |
| `angular-oauth2-oidc` 22 | Google Sign-In | Usa flujo implícito, ya desaconsejado (ver hallazgo A-6) |
| `chart.js` + `chartjs-chart-matrix` | Gráficos | |
| `driver.js` | Recorridos guiados | |
| `tailwindcss` 4 | Estilos utilitarios | Convive con el tema de PrimeNG mediante capas CSS ordenadas |

La convivencia PrimeNG/Tailwind está resuelta correctamente con `cssLayer` y el orden
`theme, base, primeng, utilities`.

## 7. Superficie de configuración

| Archivo | Estado |
|---|---|
| `angular.json` | **Le falta `fileReplacements`** — origen del hallazgo crítico C-1 |
| `tsconfig.json` | **Sin `strict`, sin `strictTemplates`** — hallazgo A-1 |
| `environments/environment.ts` | El único que llega al bundle, incluido el de producción |
| `environments/environment.prod.ts` | **Código muerto**: nada lo importa |
| `ngsw-config.json` | Correcto: cachea el shell, nunca los datos |
| `playwright.config.ts` | 14 especificaciones E2E configuradas |
| `.github/` | **No existe** |
| `eslint.config.*` | **No existe** |
