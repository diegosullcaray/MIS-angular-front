# Cómo funciona el sistema

El MIS Host es el portal de Financiera Confianza: una aplicación Angular 22
*zoneless* con componentes standalone, señales, PrimeNG y Tailwind v4. Este
documento describe **cómo está construido hoy**, de la primera pantalla al dato
que aparece en una tabla.

Es la puerta de entrada de la documentación técnica. Después:

- [`02-anatomia-de-un-modulo.md`](./02-anatomia-de-un-modulo.md) — cómo se
  organiza cada módulo por dentro y dónde va cada cosa.
- [`03-tablas-de-reportes.md`](./03-tablas-de-reportes.md) — cómo se crea una
  tabla de reporte, de punta a punta.

---

## 1. Arranque

`main.ts` levanta `AppComponent` con `appConfig` (`src/app/app.config.ts`), que
declara todo lo que la aplicación necesita antes del primer render:

| Proveedor | Para qué |
|---|---|
| `provideZonelessChangeDetection()` | Sin zone.js. Todo lo reactivo pasa por señales. |
| `provideRouter(APP_ROUTES, withComponentInputBinding())` | Rutas, con los parámetros de ruta enlazados como `input()`. |
| `provideHttpClient(withFetch(), withInterceptors(...))` | `fetch` nativo más los tres interceptores: sesión, errores y overlay de carga. |
| `provideOAuthClient()` | Google Sign-In. |
| `providePrimeNG({ theme: MisTheme })` | PrimeNG con el preset propio y `darkModeSelector: '.dark'`. |
| `provideServiceWorker(...)` | PWA. Nunca cachea respuestas del backend. |

Tres `provideAppInitializer` corren antes de pintar nada: restaurar la sesión
persistida, aplicar las preferencias de interfaz (tema, fondo, menú) y sembrar
las fuentes del buscador.

## 2. Entrar: login → guards → shell

1. **`/login`** — Google Sign-In. `AuthService.completarLoginGoogle()` toma el
   `id_token`, saca el correo y lo manda al backend, que devuelve el perfil
   (`profile`), la fecha de corte (`curr_fec`) y los usuarios alternos.
2. La sesión se guarda en `sessionStorage` con vencimiento. `restaurarSesion()`
   la recupera al refrescar, así el guard no expulsa al usuario.
3. **`authGuard`** protege `/app`; **`roleGuard`** protege lo que pide rol.
4. **`ShellLayoutComponent`** es el marco: rail de sistemas, header y
   `<router-outlet>`.

Al cerrar sesión se borra todo lo que el navegador guardó — `localStorage`,
`sessionStorage`, cookies, cachés de la PWA y service workers. Ver
[`06-preferencias-y-cierre-de-sesion.md`](./06-preferencias-y-cierre-de-sesion.md).

## 3. Estructura de `src/app`

```
src/app/
├── core/              lo transversal: no depende de ninguna pantalla
│   ├── guards/           authGuard, roleGuard
│   ├── interceptors/     sesión, errores, overlay de carga
│   ├── services/         ShellStateService (estado del shell)
│   ├── preferencias/     preferencias de interfaz y borrado de sesión
│   └── winder/           el cliente del backend (ver §4)
├── pages/
│   ├── full-pages/       login, error, y el layout del shell
│   └── modules/          los módulos de negocio (ver 02-anatomia-de-un-modulo)
├── shared/
│   ├── ui/               componentes reutilizables (tablas, gráficos, filtros…)
│   └── services/         tema, overlays
└── theme/                tokens.css y el preset de PrimeNG
```

La regla es simple: **`core` no importa de `pages`**, y `shared` no importa de
ningún módulo concreto.

## 4. De dónde salen los datos: el protocolo Winder/Ant

Todo el dato de negocio viene del backend legado por un protocolo propio. La
cadena es siempre la misma:

```
Componente → Service del módulo → BloqueReporteService → ModReportesService
                                                       → WinderService → RESTService → HttpClient
```

- **`RESTService`** hace el POST.
- **`WinderService`** arma el sobre: la petición viaja con una cabecera
  `Winder-Params` que lleva un **Strand** serializado — el objeto que le dice al
  backend qué módulo, qué operación y con qué parámetros.
- **`ModReportesService`** (y sus hermanos `ModRep2Service`,
  `ModSeccionesService`, `ModSysLoginService`) exponen las operaciones concretas
  de cada módulo del backend.
- **`BloqueReporteService`** es la fachada que usan los reportes: resuelve la
  fecha de corte, arma los parámetros del nodo de jerarquía y mapea la respuesta.

### Los motores de reporte

El backend tiene tres formas de devolver un reporte, y **no son intercambiables**:

| Motor | Método | Devuelve |
|---|---|---|
| Mixto (`regularData`) | `regular`, `regularExacto`, `regularPaginado`, `regularTolerante`, `regularLento` | Tabla multi-encabezado (`headers` + `body`) |
| `table.regular` | `tablaRegularCon`, `tablaRegular` | Tabla de columnas dinámicas (`headers` serializado + `data`) |
| Gráficos (`graphicData`) | `graficos` | Bloques Highcharts |
| Deprecado (`reportData`) | `deprecado` | Igual que el mixto, para los reportes viejos |

**Cuál usa cada reporte lo decide el HOST del legado, no el mapa.** El
`reportType` de `cra-map.ts` solo lo consulta el host `cra-v1p1`; los hosts
`-v4`, `-v7`, `-v10` y `-v11` llaman directo a `getRegularData()`. Pedir un
reporte por el motor equivocado devuelve HTTP 500.

### Detalles del protocolo que muerden

- **El nombre del corte cambia por reporte**: unos esperan `fec` (que agrega
  `regular()`), otros `fecha`, y algunos hosts no lo reciben en absoluto.
- **`fec` va en dos formatos**: `YYYYMMDD` para el motor mixto (`bloques.fec()`)
  y `YYYY-MM-DD` para `table.regular` (`bloques.fecha()`).
- **Un bloque sin filas responde 500.** Dentro de un `forkJoin` eso tumba el
  reporte entero, así que los reportes de varios bloques usan
  `regularTolerante()`.
- **Los reportes paginados** (host `cra-V10`) necesitan `pagen` y el nodo de
  jerarquía COMPLETO, no solo `tip_cod`/`cod_rel`.

## 5. La jerarquía organizativa

Casi todo reporte se consulta por un nodo de la organización: territorio, unidad,
oficina, asesor. El selector en cascada y su fallback de fecha están en
[`04-filtros-jerarquia-organizativa.md`](./04-filtros-jerarquia-organizativa.md).

Lo que llega al service es un `NodoConsulta`: `tip_cod` (el tipo de nivel) y
`cod_rel` (el código del nodo).

## 6. Estado compartido

`ShellStateService` es el único estado global: usuario activo, ícono de sistema
seleccionado, si hay una sesión cerrándose. Los módulos remotos solo leen sus
señales de solo lectura; el Host es el único que las muta.

Las preferencias de interfaz (tema, fondo, estructura del menú, anuncios) viven
aparte, en `core/preferencias/`, con su propia arquitectura en capas.
