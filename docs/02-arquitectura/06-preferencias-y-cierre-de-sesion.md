# Preferencias de interfaz y cierre de sesión

Cómo el Host guarda lo que el usuario elige sobre el aspecto del sistema —fondo,
color de acento, tema, estructura del menú, anuncios— y cómo lo borra todo al
cerrar sesión.

El módulo vive en `src/app/core/preferencias/` y está separado en tres capas:

```
core/preferencias/
├── dominio/                                  entidades y reglas puras (sin Angular, sin DOM)
│   ├── preferencias.model.ts                    tipos, catálogos, valores de fábrica y `sanearPreferencias`
│   ├── anuncio.model.ts                         entidad `Anuncio` y la regla `anunciosPendientes`
│   ├── color.util.ts                            aritmética de color (hex → rgb, mezclas, luminancia)
│   ├── repositorio-preferencias.puerto.ts       puerto de salida + implementación nula en memoria
│   └── anuncios.puerto.ts                       puerto de entrada del catálogo de anuncios
├── aplicacion/                               casos de uso: orquestan, no conocen el navegador
│   ├── preferencias.service.ts                  leer/cambiar/restablecer preferencias
│   ├── anuncios.service.ts                      qué anuncios mostrar y cuándo
│   └── limpieza-sesion.service.ts               borrado total al cerrar sesión
└── infraestructura/                           adaptadores concretos
    ├── preferencias-local-storage.repositorio.ts   el "de momento en localStorage"
    ├── apariencia-dom.adaptador.ts                 escribe las variables CSS en <html>
    ├── almacenamiento-navegador.ts                 localStorage / cookies / cachés / service workers
    └── anuncios-del-sistema.ts                     catálogo publicado hoy
```

La dirección de las dependencias es siempre **infraestructura → aplicación →
dominio**. El dominio no importa nada de Angular salvo `InjectionToken` para
declarar sus puertos.

## Qué se guarda

Todo el árbol va en **una sola clave** de `localStorage`, `mis.preferencias`:

```jsonc
{
  "apariencia": { "tema": "oscuro", "fondo": "institucional", "colorFondo": "#1d396e", "acento": "#00a2ff" },
  "estructura": { "modoSidebar": "estatico", "etiquetasSidebar": true, "vistaExplorador": "cuadricula" },
  "anuncios":   { "vistos": [], "silenciar": false },
  "recientes":  [{ "ruta": "/app/actividades/dest-credito", "titulo": "Destino de Crédito", "categoria": "Actividades", "fechaVisita": 1757270400000 }]
}
```

Una sola clave y no una por ajuste: así el borrado de sesión tiene un objetivo
único, y todo lo que se lee pasa por `sanearPreferencias`, que repone campo por
campo lo que no entienda. Un JSON de una versión anterior, a medias o corrupto
no llega nunca a escribirse como variable CSS.

`localStorage` es hoy el único adaptador del puerto `RepositorioPreferencias`.
Cambiarlo por uno contra el backend es cambiar un `provide` en `app.config.ts`:
ni el dominio ni los casos de uso se enteran.

## Reportes recientes

`recientes` es el historial que el Home muestra como accesos rápidos: los
últimos **6** reportes abiertos, del más nuevo al más viejo. Se guarda la
**ruta**, no el `cod_rep`: es lo que hace falta para volver a la pantalla, y el
`cod_rep` no identifica una URL del Host.

Quien lo anota es `RecientesService` (`core/recientes/`), que escucha
`NavigationEnd` del router y se arranca una vez desde `app.config.ts`. Escuchar
al router y no a los componentes es lo que hace que cubra las 91 pantallas sin
que ninguna colabore: no hay nada que agregar al crear un reporte nuevo.

- Descarta lo que no es un reporte: cualquier cosa fuera de `/app`, las rutas de
  un solo segmento (índices de módulo) y `dashboard`, `login` y `error`.
- Descarta la query string: `?fec=…` no cambia la identidad del reporte, así que
  visitarlo con otra fecha no crea una entrada nueva.
- El título sale de la misma fuente que el breadcrumb del header:
  `MenuStgService.buscarPorRuta()` si el árbol del STG ya cargó, y si no las
  etiquetas del Host (`SEGMENTO_LABELS`). La categoría es el nodo padre.
- `registrarReporteReciente()` desduplica por ruta: revisitar un reporte lo
  devuelve al frente con la fecha nueva, no agrega una segunda entrada.

En pantalla es una **lista de segmentos sueltos**, no un tablero: una línea por
reporte (`título · categoría` a la izquierda, antigüedad a la derecha), cada una
en su propio bloque de vidrio, separadas por aire para que se vea el fondo de
escritorio. Deliberadamente no usa `.kpi-card`: un historial no es un indicador,
y la elevación al hover de esa tarjeta lo haría leer como uno.

Como todo lo demás, se borra al cerrar sesión — `olvidar()` repone las
preferencias de fábrica, y las de fábrica traen el historial vacío.

## Cómo se aplica

`AparienciaDomAdaptador` es el único punto donde una preferencia se convierte en
pixeles. Escribe variables CSS **inline** en `<html>`, que por especificidad
ganan a `:root`, a `.dark` y a los `@media` de `tokens.css`; quitar la variable
devuelve el control a la hoja de estilos, así que "volver a lo de fábrica" no
necesita conocer el valor original.

| Preferencia | Qué escribe |
|---|---|
| Fondo tipo `color` | `--mis-wallpaper: none` + `--mis-wallpaper-color: <hex>` |
| Fondo tipo `degradado` | `--mis-wallpaper: linear-gradient(...)` |
| Fondo `institucional` | nada: manda `tokens.css` con sus variantes de escritorio y de tema oscuro |
| Cualquier fondo elegido | `--mis-wallpaper-velo: transparent` y `--mis-glass-bg` opaco |
| Acento | `--mis-accent`, `--mis-secondary`, `--mis-secondary-hover`, `--mis-secondary-light`, `--mis-text-on-secondary`, `--mis-shadow-focus` |
| Modo de menú | atributos `data-menu` y `data-menu-etiquetas` en `<html>`, y el token `--mis-sidebar-col1-w` |

El tema claro/oscuro sigue siendo de `ThemeService`, pero ese servicio **ya no
persiste**: solo resuelve el modo `sistema` contra `prefers-color-scheme` y
refleja el resultado en la clase `.dark`. Quién eligió el tema y dónde queda
guardado es asunto de `PreferenciasService`, que lo empuja con `setModo()`. Sin
esa separación el tema quedaría guardado en dos sitios y el borrado de sesión
tendría que conocer los dos.

## Estructura del menú

Cuatro modos, con el mismo comportamiento que ofrece el layout de PrimeNG:

| Modo | PrimeNG | Comportamiento |
|---|---|---|
| `estatico` | static | Rail fijo a la izquierda, con el nombre debajo de cada ícono |
| `delgado` | slim | El mismo rail fijo pero solo con íconos (52 px) |
| `superpuesto` | overlay | El rail se oculta y se abre sobre el contenido desde el botón del header |
| `horizontal` | horizontal | Los sistemas van en una banda debajo del header |

Se publican como `data-menu` en `<html>` y cada componente del shell reacciona
desde su propio CSS (`:host-context(html[data-menu='...'])`) sin pasarse inputs
entre sí. Los cuatro aplican **desde el breakpoint `sm`**: por debajo el rail es
siempre la barra inferior fija, igual que en PrimeNG, donde el móvil siempre
superpone.

`superpuesto` es el único que además cambia el markup: necesita una máscara
(`.sidebar-mask`, el equivalente del `layout-mask` de PrimeNG) para cerrarse al
tocar afuera, y elegir un sistema lo cierra —si no, taparía lo que se acaba de
abrir.

## Anuncios

El diálogo de anuncios aparecía en **cada inicio de sesión**. La corrección no es
un `if` en el componente: es una regla de dominio.

Un anuncio **es una imagen**: las piezas que publica Comunicación Interna ya
vienen diseñadas y viven en `src/assets/images/fc/ads`. No hay título, cuerpo ni
severidad — y hay **un comunicado vigente a la vez**, así que el visor muestra
una sola imagen, sin recorrido ni paginación.

`comunicadoVigente(catalogo, hoy)` devuelve la pieza publicada —el primer
elemento del catálogo que no haya caducado— y `estaPendiente(anuncio, vistos)`
dice si todavía hay que mostrarla. `AnunciosService.abrirSiCorresponde()` —que
`ShellLayoutComponent` llama una sola vez, al entrar con un usuario
autenticado— solo abre el diálogo si esa pieza sigue sin leerse y el usuario no
la silenció. Cerrar el diálogo registra su `id` como visto, y con eso el aviso
no vuelve.

Publicar el siguiente comunicado (`anuncios-del-sistema.ts`):

1. Dejar la imagen nueva en `src/assets/images/fc/ads`.
2. Agregar su entrada **arriba** de `ANUNCIOS_DEL_SISTEMA`, con un `id` nuevo y
   las medidas reales del archivo en `ancho`/`alto` — con ellas el navegador
   reserva el espacio y el diálogo no salta mientras la imagen carga.

Reglas del catálogo:

- El `id` es la identidad anti-spam. Reemplazar la imagen para corregir una
  errata no exige un id nuevo; querer que todos la vuelvan a ver, sí.
- `vigenteHasta` es para lo que caduca: pasada esa fecha queda vigente el
  siguiente de la lista.
- `fijo` reaparece en cada ingreso aunque se cierre — para avisos que tienen que
  estar delante del usuario mientras duren.

El catálogo se inyecta por el token `CATALOGO_ANUNCIOS`: hoy es una constante y
mañana puede ser un servicio contra el backend sin tocar el caso de uso ni el
diálogo.

**Anuncios no es Notificaciones.** Son dos ajustes distintos en Configuración →
General y se distinguen también por el ícono: los comunicados van con megáfono
(`pi pi-megaphone`, y `lucideMegaphone` en el header) y las notificaciones —los
avisos que genera el sistema por la actividad del usuario— con campana
(`pi pi-bell`).

## Cierre de sesión

`AuthService.cerrarSesion()` es asíncrono y delega en `LimpiezaSesionService`
antes de navegar al login. El borrado es **total, no una lista de claves
conocidas**: en un equipo compartido —que es el caso de una agencia— el
siguiente usuario no debe encontrar nada del anterior, y una lista de claves
dejaría vivo lo que cualquier módulo hubiera guardado sin avisar.

1. `localStorage.clear()`
2. `sessionStorage.clear()`
3. Todas las cookies visibles desde JavaScript, caducadas por cada prefijo del
   dominio y por cada nivel de la ruta actual (una cookie solo se borra desde el
   mismo `domain` y `path` con los que se escribió). Las `HttpOnly` no se ven
   desde el navegador y solo las puede matar el backend.
4. Todas las cachés de la Cache API (las que llena el service worker de la PWA).
5. Baja de los service workers registrados — sin esto, el worker anterior sigue
   sirviendo el app-shell cacheado aunque las cachés estén vacías.

Cada paso falla en silencio y el resto continúa: un `localStorage` bloqueado no
puede impedir que se vacíe la caché, y ningún fallo del borrado puede impedir que
el usuario quede fuera de la sesión. Al final, `PreferenciasService.olvidar()`
alinea la memoria con el almacenamiento ya vacío **sin volver a escribir** — si
persistiera, dejaría un archivo de preferencias recién escrito por la sesión que
se acaba de cerrar.

## Dónde se toca desde la interfaz

- **Configuración → Apariencia** (`panel-apariencia.component`): tema, catálogo
  de fondos, color personalizado (`p-colorpicker`), acento y restablecer.
- **Configuración → Estructura** (`panel-estructura.component`): modo del menú,
  etiquetas y vista del explorador.
- **Configuración → Anuncios** (`panel-anuncios.component`): silenciar, volver a
  mostrar el comunicado leído y ver la pieza vigente.
- **Header**: el botón de tema, el megáfono de comunicados (con punto cuando hay
  algo sin leer) y, solo en modo superpuesto, el botón que abre el rail.

## Tests

- Unitarios: `anuncio.model.spec.ts` (la regla anti-spam), `anuncios.service.spec.ts`,
  `preferencias.service.spec.ts` (persistencia y variables CSS aplicadas),
  `recientes.service.spec.ts` (qué rutas se anotan y cuáles no),
  `inicio.component.spec.ts` (las filas del Home y el tiempo relativo),
  `limpieza-sesion.service.spec.ts` y `almacenamiento-navegador.spec.ts` (borrado total).
- E2E: `e2e/comunicados.spec.ts` (se abre en el primer ingreso y no vuelve),
  `e2e/home-recientes.spec.ts` (el Home sin saludo, el estado vacío, la lista y
  la captura por router) y `e2e/configuracion.spec.ts` (el fondo se aplica y
  persiste, el selector de color recibe el puntero, ninguna pantalla genera
  scroll horizontal).
- `inyectarSesionVigente` siembra los comunicados silenciados: sin eso su
  máscara modal taparía lo que prueban los demás specs. `comunicados.spec.ts`
  usa `inyectarSesionSinPreferencias` para verlos, como un usuario nuevo.
