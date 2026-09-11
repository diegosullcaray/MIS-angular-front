# Incidentes de calidad

Registrar aqui defectos reproducibles de UI, contratos, navegacion o datos. Cada incidente debe incluir pantalla, usuario/rol, fecha de corte, pasos, resultado esperado, resultado actual y prueba de regresion.

Los campos obligatorios salen de la [política de evidencia](../evidence-policy.md).

---

## INC-2026-09-08-01 · La suite unitaria caía entera donde jsdom no da almacenamiento

| Campo | Valor |
|---|---|
| **Componente** | Entorno de pruebas unitarias (`src/test-setup.ts`) |
| **Commit evaluado** | `eae0051` |
| **Fecha** | 2026-09-08 |
| **Entorno** | Windows, ruta del proyecto con espacios (`D:\FINANCIERA CONFIANZA\…`); Vitest + jsdom 29.1.1 |
| **Estado** | **Corregido** |
| **Evidencia** | Log completo de la corrida, transcrito abajo. El archivo crudo se retiró del repositorio en `a3b4fb6`. |

### Resultado observado

**92 pruebas fallidas en 12 archivos.** Los 12 son exactamente los que tocan
almacenamiento web, y el error es siempre el mismo:

```
TypeError: Cannot read properties of undefined (reading 'clear')
 ❯ ... localStorage.clear();
```

### Resultado esperado

Los 12 archivos en verde: ninguno prueba almacenamiento, solo lo usan para
aislarse entre casos.

### Causa raíz

**No son 92 defectos, es uno.** `localStorage` y `sessionStorage` llegaban
`undefined` al spec.

jsdom no expone el almacenamiento cuando el documento tiene un **origen opaco**.
Medido contra el jsdom del proyecto:

| URL del documento | `window.localStorage` |
|---|---|
| sin `url` / `about:blank` | **lanza** `SecurityError: localStorage is not available for opaque origins` |
| `file:///D:/FINANCIERA%20CONFIANZA/…` | **lanza** el mismo `SecurityError` |
| `http://localhost:3000` | `object` |

Cuando ese *getter* lanza, Vitest no puede copiar la propiedad al `globalThis`
del worker y el global queda sin definir. El log de la incidencia muestra rutas
`file:\D:\FINANCIERA%20CONFIANZA\…`, que es el escenario de la segunda fila.

`angular.json` es idéntico en las dos máquinas y `@angular/build:unit-test` no
expone ninguna opción de entorno para jsdom — el `schema.json` del builder tiene
`browsers`, `runner`, `runnerConfig` y `setupFiles`, pero nada de `url`. El
entorno lo arma Vitest, y ahí es donde las dos máquinas divergen.

> **En el contenedor de desarrollo el fallo no se reproduce**: ahí jsdom resuelve
> un origen real y la suite pasa. Por eso la corrección no intenta adivinar por
> qué diverge la máquina — hace que la suite deje de depender de eso.

### Corrección

`src/test-setup.ts` instala un almacén en memoria con la forma de `Storage`
**solo cuando el entorno no trae uno** (detectado con `try/catch`, porque el
acceso puede lanzar). Donde jsdom sí lo expone, no se instala nada.

El respaldo respeta los dobles de prueba: si un spec pisa `Storage.prototype.clear`
para simular un almacenamiento bloqueado —como hace
`almacenamiento-navegador.spec.ts`— el respaldo deja pasar ese doble primero. Sin
eso sería *más* tolerante que el almacén real y esa prueba habría pasado a verde
por el motivo equivocado.

### Prueba de regresión

`src/test-setup.spec.ts` — 5 casos que verifican que ambos almacenes existen,
guardan, borran y llegan vacíos a cada test. Es la prueba que faltaba: convierte
un problema de entorno en **un** fallo que se explica solo, en vez de 92
repartidos por el árbol.

Verificado simulando el entorno degradado (un `setupFile` previo que borra los
globales): **125 de 125 en verde**, incluidas las 92 que caían.

---

## INC-2026-09-08-02 · El spec de sesión seguía afirmando 30 minutos

| Campo | Valor |
|---|---|
| **Componente** | `AuthService` (`src/app/pages/full-pages/auth/service/auth.service.spec.ts`) |
| **Commit evaluado** | `eae0051` |
| **Fecha** | 2026-09-08 |
| **Entorno** | Reproducible en cualquier máquina |
| **Estado** | **Corregido** |

### Resultado observado

Dos casos en rojo:

```
AssertionError: expected 1788884015061 to be less than or equal to 1788882815061
```

La diferencia es de 1 200 000 ms — exactamente 20 minutos.

### Causa raíz

El mismo commit subió `DURACION_SESION_MS` de 30 a 50 minutos en
`src/app/app.global.ts`. El spec repetía el número `30 * 60 * 1000` en cuatro
lugares en vez de leer la constante, así que una decisión de producto legítima
dejó las pruebas en rojo.

### Corrección

El spec importa `DURACION_SESION_MS` y deriva de ahí la ventana de expiración y
los avances de reloj. La duración de la sesión puede volver a cambiar sin tocar
el spec.

### Prueba de regresión

Los mismos dos casos, ahora atados a la constante.

---

## INC-2026-09-08-03 · El anillo de carga ciclaba colores en vez del celeste de marca

| Campo | Valor |
|---|---|
| **Componente** | `<app-loading-overlay>` |
| **Fecha** | 2026-09-08 |
| **Navegador / viewport** | Chromium, 1280×800 y 375×780, claro y oscuro |
| **Estado** | **Corregido** |

### Resultado observado

El CSS declaraba `stroke: var(--mis-secondary)` y el anillo se veía verde,
amarillo y rojo alternándose.

### Causa raíz

Aura aplica **dos** animaciones a `.p-progressspinner-circle`:
`p-progressspinner-dash` (el trazo) y `p-progressspinner-color`, que recorre
cuatro colores y pisa el `stroke`. El override del proyecto ajustaba
`animation-duration`, lo que además comprimía el ciclo de color de 6 s a 1.6 s y
lo hacía más notorio.

### Corrección

Se declara solo la animación del trazo, con lo que el `stroke` de marca
prevalece. De paso se agrandó la composición a anillo 144 / avatar 104 px: a
112/80 el Puma seguía leyéndose como un ícono y no como la mascota.

### Prueba de regresión

Cubierto por `loading-overlay.component.spec.ts` en cuanto a estructura
(anillo + avatar + `aria-busy`). El color es una comprobación visual: capturas
en claro y oscuro.

---

## INC-2026-09-08-04 · Nueve E2E en rojo que no reproducen fuera de esa máquina

| Campo | Valor |
|---|---|
| **Componente** | Suite Playwright (lotes de actividad diaria/mensual y `responsive-movil`) |
| **Commit evaluado** | `eae0051` |
| **Fecha** | 2026-09-08 |
| **Entorno reportado** | Windows, `D:\FINANCIERA CONFIANZA\…` |
| **Estado** | **No reproducido** — sin cambio de código |
| **Evidencia** | 9 carpetas de Playwright con `error-context.md` y captura, resumidas abajo. Se retiraron del repositorio en `a3b4fb6`. |

### Resultado observado en la máquina que reportó

Dos patrones:

1. `page.waitForLoadState` agotando los 30 s del timeout — siete casos, entre
   ellos `seguro-pasivos-grafico` y varios de los lotes 02 y 03.
2. `#tour-sidebar-icons` no visible en `/app/reportes` a 384 px
   (`responsive-movil`), con la navegación aún en curso.

### Resultado en el contenedor de verificación

**523 pasadas, 1 omitida, 0 fallidas** sobre el mismo commit, en los dos
proyectos (`desktop-chromium` y `mobile-chromium`).

### Lectura

Los dos patrones son de espera, no de comportamiento: en el primero la página
llegó a `load` y el test seguía esperando `networkidle`; en el segundo la
aserción corrió mientras la navegación no había terminado. Es lo que se ve
cuando la máquina va más lenta que los timeouts del spec, no cuando la pantalla
está rota.

**No se cambió código por esto.** Endurecer un timeout o relajar una aserción
para que pase en una máquina lenta esconde el problema en vez de resolverlo. Si
vuelve a aparecer conviene decidir entre subir los timeouts del proyecto o
cambiar `waitForLoadState('networkidle')` por una espera sobre un elemento
concreto, que es la práctica recomendada de Playwright y no depende de la
velocidad del equipo.

---

## INC-2026-09-08-05 · El comunicado no cerraba al hacer clic fuera, y sus dos botones hacían lo mismo

| Campo | Valor |
|---|---|
| **Componente** | `<app-anuncios-dialog>` y `AnunciosService` (layout) |
| **Commit evaluado** | `8a4d56d` |
| **Fecha** | 2026-09-08 |
| **Estado** | **Corregido** |
| **Origen** | Tarea 1 de `incidencias.md` |

### Resultado observado

El diálogo solo se cerraba con la X. Y los dos botones del pie, que prometen
cosas distintas, terminaban en el mismo lugar: "Entendido" escribía el id en
`localStorage` —o sea, no volvía nunca más—, y "No mostrar comunicados" apagaba
**todos** los comunicados con un interruptor global, incluidos los que todavía
no se publicaron.

### Resultado esperado

- Clic fuera cierra, igual que la X.
- **Entendido**: se calla en esta sesión de navegación.
- **No mostrar este comunicado**: se calla para siempre, solo ese.

### Corrección

`[dismissableMask]="true"` en el diálogo, y dos caminos separados en el
servicio: `cerrar()` apunta el id en el nuevo `ComunicadosSesionService`
(`sessionStorage`, clave `mis.comunicados.sesion`) y `noMostrarEste()` lo
persiste con `PreferenciasService.marcarAnunciosVistos`. El interruptor global
sigue existiendo, pero solo donde corresponde: Configuración → Comunicados.

`sessionStorage` y no una señal en memoria porque recargar la página no puede
revivir un aviso que el usuario acaba de cerrar.

### Regresión

`anuncios.service.spec.ts` (los dos caminos y la vuelta en la siguiente
sesión), `comunicados-sesion.service.spec.ts` y `anuncios-dialog.component.spec.ts`.

### Desvíos declarados

Dos cosas que pide la tarea y **no** se implementaron, por decisión explícita:

1. **Clave por usuario.** La tarea pide guardar los comunicados leídos "bajo una
   clave saneada del usuario activo". Se dejó el documento único
   `mis.preferencias`: el cierre de sesión vacía `localStorage` entero, así que
   dos usuarios nunca comparten estado y particionar el documento no cambiaría
   ninguna conducta observable.
2. **Conservar preferencias al cerrar sesión.** La tarea pide que el logout
   preserve `localStorage`. Se mantiene el borrado total. **Consecuencia
   asumida y conocida**: "No mostrar este comunicado" dura hasta el próximo
   cierre de sesión, no más. Esto ya era así antes de este cambio —
   `LimpiezaSesionService.limpiarTodo()` llama a `localStorage.clear()`— y no
   se introdujo acá.

---

## INC-2026-09-08-06 · "Volver" sacaba al usuario del sistema y lo dejaba en el Home

| Campo | Valor |
|---|---|
| **Componente** | `<app-window-panel>` (luz amarilla) |
| **Commit evaluado** | `8a4d56d` |
| **Fecha** | 2026-09-08 |
| **Estado** | **Corregido** |
| **Origen** | Tarea 2 de `incidencias.md` |

### Causa

La luz amarilla ya hacía `location.back()` desde la tarea T8, así que a primera
vista cumplía. El problema estaba un nivel más abajo: **el explorador del
sistema no es una ruta**. Se pinta sobre el `<router-outlet>` desde
`ShellStateService.contenidoPendienteSeleccion` (ver
`shell-layout.component.html`), y por eso abrir un reporte desde ahí deja **una
sola** entrada de historial. El paso atrás se saltaba el explorador entero y
devolvía al usuario al Home, que era literalmente el destino anterior.

Se descartó la otra opción que ofrecía la tarea —calcular el segmento padre con
`ActivatedRoute`—: las rutas de reportes son planas, con el path completo en un
solo `Route` (`'leg/com/rda/adm/res-mov'`), así que recortar un segmento apunta
a una URL que no existe y, con el comodín `**` de `app.routes.ts`, aterriza en
la pantalla de 404 sin que la navegación falle.

### Corrección

`onVolver()` resuelve en tres pasos: `volverA` explícito → **el explorador del
sistema, si lo hay y no está ya a la vista** → historial. El layout publica si
existe explorador en `ShellStateService.exploradorDisponible`, desde
`NavegacionSistemasService.panelActivo`.

### Regresión

Cuatro casos en `window-panel.component.spec.ts`.

---

## INC-2026-09-08-07 · Las pantallas de reporte no tenían forma de recargar datos

| Campo | Valor |
|---|---|
| **Componente** | `<app-reporte-simple>` |
| **Commit evaluado** | `8a4d56d` |
| **Fecha** | 2026-09-08 |
| **Estado** | **Corregido** |
| **Origen** | Tarea 3 de `incidencias.md` |

### Corrección

`ReporteSimpleComponent` apagaba con `[permitirActualizar]="false"` el botón de
actualizar que `WindowPanelComponent` ya tiene en la esquina. Se enciende
—solo cuando hay nivel elegido— y se conecta a `refrescar()`, que **reemite
`nivelSeleccionado`** con el nodo actual.

Reemitir en vez de agregar una salida nueva es lo que evita tocar las 84
pantallas que consumen este armazón: todas ya escuchan ese evento. Se emite una
**copia** del nodo (`{ ...nodo }`) a propósito: las pantallas que consultan
dentro de un `effect` sobre `nivelActual` —ver `ReporteSimpleBase`— no
reaccionarían si la señal recibiera la misma referencia.

### Desvío declarado

La tarea pedía un `<p-button icon="pi pi-refresh">` nuevo al lado del botón de
filtros. Se reusó el de la esquina: agregar otro dejaba dos refrescos en la
misma ventana y rompía la consistencia con Incentivos y el resto de los paneles.

### Regresión

Cuatro casos en `reporte-simple.component.spec.ts`.

---

## INC-2026-09-08-08 · Incentivos: un administrador se quedaba sin acceso a los niveles

| Campo | Valor |
|---|---|
| **Componente** | Módulo `incentivos` (`/app/incentivos3`) |
| **Commit evaluado** | `8a4d56d` |
| **Fecha** | 2026-09-08 |
| **Estado** | **Corregido** |
| **Origen** | Tarea 4 de `incidencias.md` |

### Causa

No era el rol. `auth.service.ts` mapea `tip_use === 0` a `admin-sistema` y
`ShellStateService.esAdmin()` lo reconoce, así que `iniciar()` sí levantaba el
diálogo. El problema es que un administrador entra **sin perfil cargado**, y
todo el cuerpo de `principal.component.html` cuelga de `@else if
(incentivos.perfil())` — incluida `<app-perfil-card>`, que era la única puerta
al selector. Cerrado el diálogo de entrada, no quedaba forma de reabrirlo.

Encima, ese diálogo no se podía cerrar: `[closable]="!obligatorio()"` le quitaba
la X y el Escape justo en el primer ingreso de un administrador.

### Corrección

1. Acción **«Seleccionar nivel»** en la barra de la ventana, proyectada en
   `[ventana-acciones]` y visible siempre que `incentivos.puedeElegirNivel()`.
   No depende de que haya perfil.
2. El diálogo pasa a ser siempre cerrable (`closable`, `closeOnEscape`,
   `dismissableMask`); `cerrar()` ya llevaba al Home, que es lo pedido. El input
   `obligatorio`, que solo servía para cerrarle la puerta, se retiró.
3. Colorimetría: los 20 hexes de `tabla-variables.component.css` —dos paletas
   paralelas mantenidas a mano, una por tema— pasan a los pares `--mis-*`, y
   con eso desaparece el bloque `.dark` duplicado. El `style="color: #ea580c"`
   de `monetizado-card` pasa a `--mis-warning`.

Los cinco chips se midieron con `contraste.util.ts`: los diez pares
(claro y oscuro) superan el umbral `textoAA` de 4.5:1.

### Regresión

Dos casos en `principal.component.spec.ts` para el acceso al selector sin perfil.

---

## INC-2026-09-08-09 · Los gráficos de Agro diario usaban la paleta del sistema viejo

| Campo | Valor |
|---|---|
| **Componente** | Actividad Diaria → Cartera → Agro (`RS_AGROMIX_*`) |
| **Commit evaluado** | `8a4d56d` |
| **Fecha** | 2026-09-08 |
| **Estado** | **Corregido** |
| **Origen** | Tarea 5 de `incidencias.md` |

### Causa

Había dos copias de la misma función. La de Actividad Mensual
(`seriesDeGraficoConColor`) asignaba `colorSerieReporte` a cada serie; la de
Actividad Diaria (`seriesDeGrafico`) devolvía las series **sin color**. Sin
color, `highcharts-factory.util.ts` cae a su paleta de respaldo —hexes
literales `#0284C7`, `#003f5c`, `#bc5090`…—, que es la que se veía como «la del
legado».

### Corrección

Una sola función, en `shared/ui/graficos/utils/series-grafico.util.ts`, que usan
los dos reportes. Mientras existieron dos copias nada impedía que volvieran a
separarse; ahora no pueden.

De paso deja de reventar con un payload roto: un JSON inválido devuelve un
bloque vacío en vez de tumbar la pantalla.

### Revisado y no tocado

`seguros-mapeo.util.ts` también arma series, pero el color se lo manda el
backend en el propio payload. No es el mismo caso y la incidencia no lo reporta.

### Regresión

`series-grafico.util.spec.ts`, siete casos.

---

## INC-2026-09-09-01 · La luz de "volver" del diálogo salía gris y sin ícono

| Campo | Valor |
|---|---|
| **Componente** | Cromo de diálogos (`src/app/pages/modules/incentivos/ui/selector-nivel-dialog/`) |
| **Commit evaluado** | trabajo previo a `c3f5393` |
| **Fecha** | 2026-09-09 |
| **Entorno** | Chrome, tema claro y oscuro |
| **Estado** | **Corregido** |
| **Evidencia** | Color computado del botón: `rgb(240, 240, 240)` — el `buttonface` del sistema, no el ámbar del semáforo. |

### Resultado observado

El diálogo "Selecciona Nivel" muestra su semáforo propio: roja para cerrar y
amarilla para volver al menú. La amarilla se veía como un círculo gris claro y
sin glifo, indistinguible de una luz apagada.

### Resultado esperado

Ámbar `#febc2e` con el chevron `‹` al pasar el mouse por el grupo, igual que la
misma luz en la barra de una ventana de módulo.

### Causa raíz

La clase se había renombrado en el repositorio: `mis-window-light--minimizar`
pasó a llamarse `mis-window-light--volver` cuando esa luz dejó de minimizar y
pasó a navegar hacia atrás. `app-window-panel` se actualizó; el diálogo, escrito
contra el nombre viejo, no.

**Un nombre de clase que no existe no es un error de nada.** El elemento se
pinta igual, sin las reglas de esa clase, y cae al estilo por defecto del
navegador. No hay compilación que falle, no hay spec que lo note —el DOM tiene
el botón, con el `class` que le pusieron— y el build queda verde.

### Corrección

Renombrar el uso en la plantilla del diálogo y en su spec. Además, la clase
`.mis-window-light--apagada` pasó a `componentes/ventana.css` para que una luz
inerte tenga nombre propio en vez de heredar el estilo del botón.

### Prevención

`governance/scripts/verificar-anclas-tour.mjs` resuelve contra `src/` los
selectores de los recorridos guiados —donde el mismo modo de falla es aún más
silencioso, porque driver.js saltea el paso sin avisar—. Reproducido de forma
controlada: apuntar un paso a `.mis-window-light--minimizar` hace que el script
falle con código 1 y el motivo exacto.

### Regresión

`selector-nivel-dialog.component.spec.ts` verifica que la luz de volver exista
dentro de un listado, devuelva al menú y no esté en el menú inicial.

---

## INC-2026-09-11-01 · Pachi quedaba fuera de la pantalla en el recorrido guiado

| Campo | Valor |
|---|---|
| **Componente** | `driver.css` (tema del globo) y `DriverTourService` |
| **Commit evaluado** | `3eae138` |
| **Fecha** | 2026-09-11 |
| **Estado** | **Corregido** |

### Causa

`.mis-tour-mascota` era `position: absolute; left: -75px; width: 160px`: colgaba
**por fuera** del globo, y el globo en móvil era `width: calc(100vw - 24px)`. A
375 px driver.js lo coloca en `left ≈ 12px`, así que el personaje arrancaba en
**x ≈ −33 px**. No se veía.

Tampoco era solo de móvil: con el rail resaltado (`side: 'right'`) el globo
queda en x ≈ 70 y Pachi en x ≈ −5.

### Corrección

Se invierte la regla: **por defecto Pachi va dentro del globo**, como un
elemento más de la fila. Asomarse por el borde pasa a ser la excepción, desde
900 px y con menos vuelo (120 px a −56, antes 160 a −75), más un refuerzo con
`:has(.driver-popover-arrow-side-left)` para cuando el globo queda pegado al
borde izquierdo.

El globo pierde el `width: calc(100vw - 24px)` y el `margin: 0` de móvil, que
peleaban con el `left` en línea que escribe driver.js; queda
`max-width: min(370px, calc(100vw - 24px))`.

### Regresión

`e2e/bienvenida-y-tour.spec.ts`, en `mobile-chromium`: recorre los pasos y mide
que la caja de Pachi —y la del globo— quede dentro del viewport de 375 px.

---

## INC-2026-09-11-02 · El lado del globo se decidía una sola vez y con una tabla

| Campo | Valor |
|---|---|
| **Componente** | `DriverTourService` |
| **Commit evaluado** | `3eae138` |
| **Fecha** | 2026-09-11 |
| **Estado** | **Corregido** |

### Causa

Dos problemas en el mismo bloque:

1. `window.innerWidth < 640` se leía como foto **al arrancar** el recorrido.
   Girar el teléfono a mitad de camino dejaba los globos contra el borde
   equivocado: driver.js reposiciona, pero nunca volvía a pasar por el
   reacomodo.
2. El reacomodo era una tabla con un caso especial —`step.element ===
   '#tour-sidebar-icons'`—, o sea un servicio de `shared/` sabiendo dónde vive
   el rail del layout. Y no cubría ningún otro elemento del borde inferior.

### Corrección

El lado se **mide**: `getBoundingClientRect()` del ancla contra la mitad del
viewport decide `top` o `bottom`. Cubre el rail, el header, los recientes y lo
que venga, sin nombrar ninguno. Y se recalcula en `resize`/`orientationchange`
con rebote, reponiendo el paso activo (`setSteps()` + `moveTo()`).

De paso se corrigió el orden de los ciclos de vida: estaban **antes** de la
configuración de quien llama, así que un recorrido con su propio
`onDestroyStarted` se quedaba sin cierre limpio.

### Regresión

Seis casos en `driver-tour.service.spec.ts`, con las cajas de las anclas
declaradas a mano (jsdom no hace layout).

---

## INC-2026-09-11-03 · El panel de novedades tapaba lo que el recorrido señalaba

| Campo | Valor |
|---|---|
| **Componente** | `app-panel-novedades` |
| **Commit evaluado** | `3eae138` |
| **Fecha** | 2026-09-11 |
| **Estado** | **Corregido** |

### Causa

El panel es `position: fixed` encima del contenido y no se cerraba al lanzar un
recorrido. En un teléfono, donde ahora ocupa todo el ancho, el paso resaltaba
justo detrás del panel.

### Corrección

`verGuia()` cierra el panel antes de arrancar, salvo que la novedad declare
`requierePanel: true` — solo la que habla del propio panel. Y en menos de 640 px
el panel deja de ser una barra de 300 px contra el borde para abrirse como hoja
a pantalla completa: una franja de 300 px en un teléfono no dejaba Home ni
panel usables.

### Regresión

Tres casos en `panel-novedades.component.spec.ts` y uno en
`e2e/bienvenida-y-tour.spec.ts`.

---

## INC-2026-09-11-04 · Las poses de Pachi pesan 7,3 MB

| Campo | Valor |
|---|---|
| **Componente** | `src/assets/images/fc/tours/` |
| **Commit evaluado** | `3eae138` |
| **Fecha** | 2026-09-11 |
| **Estado** | **Abierto** — medido, no corregido |

### Resultado observado

Las doce poses son PNG de **1024 × 1024** y suman **7,3 MB**. Cada una supera el
umbral de 500 kB que marca `npm run audit:activos`:

```
647 kB  mascota-trabaja.png      593 kB  mascota-celebra.png
637 kB  mascota-buscar.png       592 kB  mascota-alerta.png
610 kB  mascota-escribe.png      582 kB  mascota-camina.png
…y siete más, ninguna por debajo de 500 kB
```

En pantalla se pintan entre **64 y 132 px**: unas ocho veces más chicas de lo
que pesan. El recorrido descarga una por paso, y esto es justamente sobre la
conexión de un teléfono.

### Por qué queda abierto

Redimensionar requiere una herramienta de imagen que este entorno no tiene
—sin `sharp`, `pngquant`, `optipng` ni ImageMagick—, y sumar una dependencia
para una tarea de activos es una decisión del equipo, no de este cambio.

**Recomendación**: reescalar a ~256 px (el doble del mayor tamaño de render) y
volver a codificar. Debería dejar el conjunto por debajo de 500 kB **en total**,
contra los 7,3 MB actuales.

### Mitigación aplicada

El `<img>` de cada paso declara `width`/`height` reales y `decoding="async"`:
el navegador conoce la proporción antes de decodificar, así que el globo no
salta mientras el PNG carga. No reduce el peso.

### Nota sobre la compuerta

`npm run audit:activos` lista estas imágenes como **sin uso**, y no lo están:
`conPachi()` arma la ruta en tiempo de ejecución (`${MASCOTA}${pose}.png`) y el
escáner es estático. Borrarlas rompe el recorrido.

---

## INC-2026-09-11-05 · La acción «Seleccionar nivel» de Incentivos se perdió en una reescritura

| Campo | Valor |
|---|---|
| **Componente** | `incentivos/components/principal` |
| **Commit evaluado** | `28e5097` |
| **Fecha** | 2026-09-11 |
| **Estado** | **Corregido** |

### Resultado observado

La reescritura de `principal.component.html` se llevó puesto el botón
«Seleccionar nivel» de la barra de la ventana, que era la corrección de
[INC-2026-09-08-08](#): sin él, un administrador que cierra el diálogo de
entrada se queda otra vez sin forma de elegir nivel.

**Lo detectó el spec de regresión**, no una persona. Es exactamente para lo que
se escribió.

### Además

El mismo commit dejó dos archivos de prueba en rojo, y no por su contenido:

- `principal.component.spec.ts` — la plantilla nueva usa `pAnimateOnScroll`, que
  mira `IntersectionObserver`; jsdom no lo implementa y el archivo entero caía
  con `ReferenceError`. Se agrega el doble, al lado del de `ResizeObserver` que
  ya estaba.
- `selector-nivel-dialog.component.spec.ts` — `cerrar()` pasó a consultar
  `incentivos.perfil()` y el doble del servicio no lo ofrecía. El cambio de
  conducta es **mejor** que el anterior (solo sale al Home si todavía no hay
  nivel cargado, en vez de salir siempre), así que se ajusta el doble y se
  cubren las dos ramas.

---

## INC-2026-09-11-06 · El panel de novedades bloqueaba el menú de perfil en escritorio

| Campo | Valor |
|---|---|
| **Componente** | `app-panel-novedades` |
| **Commit evaluado** | `3eae138` |
| **Fecha** | 2026-09-11 |
| **Estado** | **Corregido** |

### Resultado observado

Con el panel abierto —que es como arranca por encima de 1280 px—, **Configuración
y Cerrar sesión no se podían pulsar**. Playwright lo dice con todas las letras:

```
<span class="novedad-titulo"> from <main …> subtree intercepts pointer events
```

Seis casos de `configuracion.spec.ts` en rojo, en los dos proyectos.

### Causa

El panel declaraba `z-index: 30`, **el mismo** que el `<header>`. Empatados,
gana el que viene después en el DOM, y `<main>` va después del header. El
`z-index: 1000` del desplegable no ayudaba: vive dentro del contexto de apilado
que crea el propio header, así que no puede escaparse de su 30.

### Corrección

El panel y su pestaña bajan a `z-index: 20`: por debajo del header, por encima
del contenido, que es donde corresponde. En móvil, además, la hoja deja pasar
al rail inferior de sistemas (`z-40`) y se reserva su alto con `padding-bottom`
— es la forma de salir de la hoja sin cerrarla primero.

---

## INC-2026-09-11-07 · Los diálogos con cabecera propia se quedaron sin nombre accesible

| Campo | Valor |
|---|---|
| **Componente** | Diálogos con `pTemplate="header"` |
| **Commit evaluado** | `28e5097` |
| **Fecha** | 2026-09-11 |
| **Estado** | **Corregido en dos de seis** — los otros cuatro necesitan una decisión |

### Resultado observado

`getByRole('dialog', { name: 'Selecciona Nivel' })` dejó de resolver. Medido en
el navegador:

```json
{ "role": "dialog", "ariaLabel": null,
  "labelledby": "pn_id_8_header", "objetivoExiste": false }
```

El `aria-labelledby` apunta a un id que **no existe**: al reemplazar la cabecera
de PrimeNG por el cromo estilo Mac, el `<span>` que llevaba ese id desapareció.
El diálogo queda sin nombre: un lector de pantalla anuncia "diálogo" y nada más.

### Corrección

PrimeNG pasa ese id al contexto de la plantilla
(`context: { ariaLabelledBy }`). Basta tomarlo y ponérselo al título propio:

```html
<ng-template pTemplate="header" let-ariaLabelledBy="ariaLabelledBy">
  <span [id]="ariaLabelledBy" class="p-dialog-title">Selecciona Nivel</span>
```

Aplicado en `selector-nivel-dialog` y `detalle-variable-dialog`, los dos que
tienen un título en su cabecera.

### Lo que queda abierto

Otros cuatro diálogos con cabecera propia **no tienen título ninguno**, ni
visible ni accesible: solo el semáforo.

```
analista/ui/selector-colaborador-dialog
categorizacion/ui/selector-sectorista-dialog
kaypacha/ui/buscador-colaborador-dialog
incentivos/ui/detalle-bancarizacion-dialog
```

Ponerles nombre es una decisión de diseño —¿título visible, o solo
`aria-label`?— y no se toma desde este cambio. Mientras tanto son cuatro
`role="dialog"` anónimos.

### Nota

Lo detectó un spec E2E, no una persona. Es el mismo modo de falla que motivó
ADR-0004: el marcado cambia, nada deja de compilar, y lo que se rompe es algo
que solo nota quien usa lector de pantalla.
