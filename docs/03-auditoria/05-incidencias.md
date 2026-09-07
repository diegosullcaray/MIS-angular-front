# Historial de incidencias — batería de responsive y color

Todo lo que las pruebas nuevas encontraron roto, y cómo se corrigió. Se
registran **20 defectos en el producto** y **6 defectos en las propias pruebas**
(falsos positivos y errores de arranque que hubo que corregir antes de poder
confiar en el resultado).

El criterio para separar unos de otros: si el test falla y **la corrección va en
`src/`**, es un defecto del producto. Si la corrección va en el test, era el
test el que estaba mal.

La sección **D** se agregó después: recoge lo que apareció al implementar los
pendientes de `docs/04-tasks/pendientesv2.md`, con el mismo criterio.

Estado final: **1800 pruebas unitarias en verde** y **519 de Playwright en
verde** (1 omitida), sin ninguna falla.

---

## A · Defectos de color (13)

Todos detectados por `tokens.paleta.spec.ts` y `paleta-colores.armonia.spec.ts`
en su primera corrida. Las razones de contraste están medidas con la misma
utilidad que usan los tests, componiendo el alfa sobre el fondo cuando el token
lo tiene.

### A-01 · El texto terciario era ilegible en los tres fondos

`--mis-text-tertiary: #94A3B8` daba **2.56:1** sobre `surface`, **2.37:1** sobre
`bg` y **2.45:1** sobre `panel-bg`, contra un mínimo de 3:1. Es el color de los
metadatos y de los estados deshabilitados: no es texto de cuerpo, pero por
debajo de 3:1 deja de leerse.

**Corrección** — `#94A3B8` → `#8390A2`: **3.24 / 3.00 / 3.10**. Mismo tono, un
paso más oscuro.

### A-02 · El acento y el color secundario no llegaban a 3:1

`--mis-secondary` y `--mis-accent` valían `#00A2FF`: **2.76 / 2.55 / 2.64** sobre
las tres superficies. Es el celeste del foco, de los bordes activos y de los
botones: WCAG 1.4.11 le exige 3:1 como componente de interfaz.

**Corrección** — `#00A2FF` → `#0094EA`: **3.27 / 3.02 / 3.12**.

### A-03 · El acento por defecto de las preferencias ganaba sobre el token

**Este es el defecto que más fácil se pasaba por alto.** Corregir el token no
alcanzaba: `AparienciaDomAdaptador` escribe el acento del usuario **en línea
sobre `<html>`**, y el valor por defecto de las preferencias seguía siendo
`#00a2ff`. O sea que el arreglo de A-02 nunca habría llegado a la pantalla de
nadie que no hubiera tocado el color de acento a mano — es decir, de casi nadie.

**Corrección** — `PREFERENCIAS_POR_DEFECTO.apariencia.acento` y
`ACENTOS_SUGERIDOS[0]` en `preferencias.model.ts`: `#00a2ff` → `#0094ea`.

### A-04 · El verde de éxito no llegaba como texto

`--mis-success: #16A34A` daba **3.30:1** sobre la superficie. Se usa como texto
en montos, variaciones y estados: le corresponde el 4.5:1 del cuerpo.

**Corrección** — `#16A34A` → `#11803A`: **5.03:1**.

### A-05 · El rojo de peligro no llegaba sobre su propio chip

`--mis-danger: #DC2626` sobre `--mis-danger-light` daba **3.95:1**. Es
exactamente el par del chip de estado: texto rojo sobre fondo rojo claro.

**Corrección** — `#DC2626` → `#D32424`: **4.25:1**.

### A-06 · El borde normal era imperceptible

`--mis-border: rgba(29,57,110,0.10)` daba **1.19:1** sobre la superficie, contra
un piso de 1.2. Marginal, pero es el divisor de toda la retícula de paneles y
tablas: por debajo del piso la estructura se pierde.

**Corrección** — subir el alfa de `0.10` a `0.12`: **1.24:1**. Se corrigió el
color y no el umbral, que es lo fácil y lo equivocado.

### A-07 y A-08 · Dos fallas que eran del test, no del producto

`border-strong` fallaba el 3:1 en los dos temas. Aquí la prueba estaba mal
planteada: `--mis-border` y `--mis-border-strong` son **divisores decorativos**,
no contornos de control. Llevarlos a 3:1 habría encuadrado toda la interfaz en
líneas duras — habría sido "arreglar" el test rompiendo el diseño.

**Corrección** — se separó el rol: se agregó `--mis-border-control`
(`#808FAD` en claro, **3.26 / 3.01 / 3.11**; `#0075B8` en oscuro,
**3.28 / 3.65 / 3.01**) para lo que sí delimita un control por sí mismo, y el
test pasó a exigirle 3:1 **a ese** token. A los decorativos se les exige
perceptibilidad (1.2:1) y que el fuerte contraste más que el normal.

El único consumidor que necesitaba el borde de control era el input del buscador
de colaboradores (`buscador-colaborador-dialog.component.html`), que se migró de
`--mis-border-strong` a `--mis-border-control`.

### A-09 · Un enlace del dashboard usaba color de componente, no de texto

En `principal.component.html` un enlace estaba pintado con
`text-[var(--mis-accent)]`. Un enlace **es texto**: le toca 4.5:1, no el 3:1 de
un componente. Con el acento daba **3.27:1**.

**Corrección** — pasó a `text-[var(--mis-primary-text)]`: **8.10:1**.

### A-10 · El lima de las series se confundía con el índigo bajo daltonismo

En `PALETA_SERIES`, el par contiguo `#6366F1` (índigo) / `#84CC16` (lima) daba
**20.4** en visión normal pero el lima quedaba fuera de rango de croma para el
resto de la escala.

**Corrección** — `#84CC16` → `#6AA312`. El par contiguo queda en **36.6**
normal y **10.5** bajo daltonismo, por encima del objetivo de 8.

### A-11 · Dos tramos de mora eran indistinguibles a simple vista

En `PALETA_TRAMOS`, el par contiguo `#B45309` (ámbar quemado) / `#DC2626` (rojo)
daba **9.9** en visión normal — muy por debajo del piso de 15. Son dos tramos de
mora consecutivos: confundirlos es leer mal la cartera.

**Corrección** — el ámbar pasó a `#B8860B`, y el par quedó en **19.0** normal y
**11.8** bajo daltonismo.

### A-12 · Dos tramos no llegaban a 3:1 sobre el fondo del gráfico

En tema oscuro, `#7C3AED` (violeta) daba **2.86:1** y `#334155` (gris) **1.57:1**
contra el fondo `#162034`. El gris directamente desaparecía.

**Corrección** — `#7C3AED` → `#8040EE` (**3.01** en oscuro, 5.40 en claro) y
`#334155` → `#606B7A` (**3.01** en oscuro, 5.41 en claro). Los dos temas quedan
por encima de 3:1.

### A-13 · Se estaba probando un color que ya no se renderiza

La paleta de reportes mixtos exportaba `AMBAR = '#ffa600'`, y contra el naranja
`#ff7c43` daba **10.7** normal y **6.0** bajo daltonismo — habría sido un
defecto real. Al rastrear el consumidor, `colorSerieReporte()` asigna cuatro
roles y **nunca llega al quinto**: el ámbar era código muerto.

**Corrección** — se retiró la constante en vez de "corregir" un color que nadie
dibuja. Los cuatro roles vivos se prueban entre **todos** sus pares (no solo los
contiguos, porque los roles no tienen orden) y el más chico queda en **21.0**
normal.

### Riesgo residual aceptado

El par contiguo `#16A34A` (tramo 1) / `#0094EA` (tramo 2) queda en **25.0** para
visión normal pero en **5.7** bajo deuteranopía, por debajo del piso de 6. No se
re-escaló porque el dashboard del analista dibuja cada tramo **con su etiqueta
al lado** (`LABELS_TRAMOS` viaja junto al color en `principal.component.ts`): la
identidad no depende del color solo, que es la condición bajo la cual el rango
6-8 es admisible. Queda anotado acá porque **es una excepción consciente**, no
un hueco: si algún día se pinta un tramo sin su rótulo, este par hay que
re-escalarlo primero.

---

## B · Defectos de responsive (7)

### B-01 · Los botones del header no llegaban al objetivo táctil

Los botones de tema y de comunicados eran `w-8 h-8` = **32×32**. El mínimo
cómodo es 44×44 (guía de Apple, y AAA de WCAG 2.5.5).

**Corrección** — `w-[44px] h-[44px] sm:w-8 sm:h-8`: 44 en móvil, y la densidad
de escritorio intacta desde `sm`. **No se cambió la estructura**, solo el
tamaño.

### B-02 · `w-11` no daba 44px

El primer intento fue `w-11` (2.75rem), que es lo que uno escribiría. Medido en
el navegador dio **41px**: el `rem` del proyecto está escalado, así que la
escala de Tailwind no coincide con el píxel nominal.

**Corrección** — píxel explícito, `w-[44px]`. El comentario quedó en el spec
para que nadie lo "simplifique" de vuelta a `w-11`.

### B-03 · La píldora de usuario no reservaba alto táctil

**Corrección** — `min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0`.

### B-04 · Los enlaces del breadcrumb quedaban por debajo del mínimo de WCAG

En móvil los `p-breadcrumb-item-link` caían por debajo de 24×24 (WCAG 2.5.8 AA).

**Corrección** — en `header.component.css`, bajo `@media (max-width: 639px)`,
se les dio `min-width: 24px; min-height: 40px; display: inline-flex`. El alto va
a 40 y no a 44 porque el header entero mide 44: 44 de área táctil dentro de 44
de header no deja aire.

### B-05 · El contenido quedaba tapado por la barra inferior fija

En móvil la Col 1 (íconos de sistemas) es una barra fija al fondo. El área
principal no reservaba ese espacio, así que la última fila de cualquier tabla
quedaba debajo de la barra.

**Corrección** — `pb-16 sm:pb-0` en el área de contenido, fijado ahora por
`shell-layout.responsive.spec.ts`.

### B-06 · El shell podía desbordar en horizontal

La columna de contenido no declaraba `min-w-0`, así que un hijo ancho (una tabla
de reportes) empujaba la página entera en vez de encogerse.

**Corrección** — `min-w-0` en la columna, y el área principal con `overflow-y-auto`
**sin** `overflow-x-auto`, para que el scroll horizontal viva en el contenedor de
la tabla y no en la página.

### B-07 · `scripts/verificar-bundle.mjs` no existía y `npm run build:prod` estaba roto

No lo encontró la batería de responsive sino el intento de correr el build de
producción: `main` había borrado el script en `b8b46cc`, pero `package.json`
seguía invocándolo en `verify:bundle`. Cualquier build de producción fallaba.

**Corrección** — se restauró el archivo desde `b8b46cc^`. Es el guardián del
hallazgo **C-1** de la auditoría de seguridad (suplantación de identidad en el
build de producción): sin él, esa protección estaba caída sin que nadie lo
notara.

**Reincidencia (2ª vez).** El commit `7a29e84` de `main` volvió a borrar
`scripts/verificar-bundle.mjs`, y esta vez se llevó también
`scripts/generar-tokens-paleta.mjs` — el que mantiene `tokens.paleta.ts` en
sincronía con `tokens.css` y sin el cual no se puede cerrar ninguna tarea de
color. `npm run build:prod` quedó roto otra vez. Se restauraron ambos desde
`21db84d^`.

Que haya pasado dos veces dice que el problema no es el borrado sino que
**nada avisa**: `verify:bundle` solo se ejecuta en `build:prod`, que no corre en
cada cambio. Mientras no haya un paso de CI que lo dispare, conviene revisar
`scripts/` después de cada merge de `main`.

---

## C · Defectos en las propias pruebas (6)

Se registran porque cada uno costó una corrida y porque el patrón se repite: una
prueba mal planteada es peor que ninguna, hace perder tiempo persiguiendo un bug
que no existe.

### C-01 · `node:fs` no existe dentro de un spec

Primer intento: leer `tokens.css` desde el test. Falló en tiempo de build
(`src/app/theme/__prueba-fs.spec.ts:1:29`) porque `@angular/build:unit-test`
empaqueta los specs y ahí no hay Node.

**Corrección** — se invirtió el flujo: un script de Node
(`scripts/generar-tokens-paleta.mjs`) parsea el CSS **antes** y emite un `.ts`
que el spec importa. Con `--check` para que no se desincronice.

### C-02 · El tema oscuro declaraba un token que el claro no

`'mis-wallpaper-velo' does not exist in type Record<...>`. La causa: el
extractor no reconocía `transparent` como valor de color, y ese token vale
`transparent` en claro.

**Corrección** — se agregó `transparent` a `ES_COLOR` y a `aRgba()`. La prueba
de coherencia entre temas —que existe justamente para atrapar un olvido en el
bloque `.dark`— habría dado un falso negativo si no.

### C-03 · Falso positivo de desborde: una etiqueta de 26px

El detector marcaba un `div` de 26×33px como desborde de su contenedor. Era una
etiqueta truncada, no un problema de layout.

**Corrección** — el desborde respecto del contenedor solo cuenta para elementos
que ocupan ≥ 25 % del ancho del viewport.

### C-04 · Falso positivo de desborde: una tabla con su propio scroll

El detector marcaba una tabla de PrimeNG de 600px en un viewport de 375. Estaba
**correctamente** dentro de `.p-datatable-table-container` con `overflow-x: auto`,
y la página no desbordaba: `scrollWidth === clientWidth === 375`.

**Corrección** — `estaContenido()` camina los ancestros buscando uno con
`overflow-x: auto | scroll | hidden | clip`, y la aserción dura pasó a ser la de
**página**, con la lista de elementos solo como pista para localizar la causa.

### C-05 · Condición de carrera al medir la barra inferior

`el contenido no queda tapado por la barra inferior fija` fallaba de forma
intermitente: se medía sin esperar a que el rail montara, y además se comparaba
contra un `56px` hardcodeado.

**Corrección** — esperar al rail y comparar `main.bottom <= rail.top`, que es la
propiedad que de verdad importa y no depende de un número mágico.

### C-06 · El spec del header no podía instanciar el componente

Las 3 pruebas de `header.responsive.spec.ts` fallaban con
`NG0201: No provider found for OAuthService`. El header arrastra media
aplicación por inyección (`AuthService` → `OAuthService`, `MenuStgService`,
`NavegacionSistemasService`, `KaypachaService`, `MessageService`), y el spec
solo proveía el router.

**Corrección** — se doblaron esas dependencias igual que en
`header.component.spec.ts`. Nada de eso interviene en el tamaño de los botones:
lo que el test mira es el HTML que sale, no de dónde salen sus datos.

---

## D · Defectos encontrados al implementar los pendientes v2 (3)

### D-01 · Las tablas en oscuro no leían los tokens del sistema

La tarea 3 pedía ajustar `--mis-surface`, `--mis-border` y `--mis-border-strong`
del bloque `.dark` para que se vieran las divisiones de las tablas. Medido en el
navegador, **cambiar esos tokens no movía nada**: las filas se pintaban con
`#020617` (el `surface.950` de Aura, un gris casi negro ajeno al navy del shell)
y sus divisores daban 1.30:1 contra ese fondo.

La causa son dos cosas encadenadas:

1. El preset solo mapeaba `datatable.root.borderColor`; el fondo de fila, el del
   encabezado y el de las filas alternas seguían saliendo de la escala `surface`
   de Aura.
2. Aura declara `root.borderColor`, `row.stripedBackground` y
   `bodyCell.selectedBorderColor` **solo dentro de `colorScheme`**, y lo que se
   declara por esquema le gana a lo declarado en el nivel de arriba. Un primer
   intento que los puso arriba no tuvo efecto: `--p-datatable-border-color`
   seguía en `{surface.800}`.

**Corrección** — en `mis-theme.ts` el bloque `datatable` mapea ahora fila,
encabezado, pie y divisiones a `--mis-surface`, `--mis-panel-bg` y
`--mis-border*`, y repite los tres tokens conflictivos dentro de `colorScheme`
(el mismo valor en claro y en oscuro: son las variables CSS las que cambian).
Recién entonces subir los divisores en `tokens.css` (0.14 → 0.26 y 0.28 → 0.42)
tuvo efecto: 1.24:1 → 1.55:1 entre filas y 1.61:1 → 2.12:1 en el contorno.

**Lección** — antes de tocar un token hay que comprobar que la pantalla lo lee.
Bastó un `getComputedStyle` sobre una fila real para descubrir que no.

### D-02 · La luz del semáforo de los diálogos desbordaba 2 px

`e2e/comunicados.spec.ts` fallaba en los dos navegadores: dentro de `.p-dialog`
había un elemento con `scrollWidth` 14 y `clientWidth` 12 — el botón de cerrar,
la luz roja de 12 px del cromo macOS.

El ícono es un SVG de PrimeNG con ancho intrínseco de 14 px que el CSS pinta a
8. Como **ítem flex** seguía reservando sus 14 px de contribución mínima, aunque
su caja midiera 8. Sacarlo del flujo es lo único que lo corrige (`overflow`,
`contain` y bajar los atributos del SVG no cambian nada; está medido).

**Corrección** — los glifos del semáforo de diálogo van `position: absolute`
centrados sobre el botón, que pasa a `position: relative`. Se ve exactamente
igual, incluida la aparición del glifo al pasar por la barra.

**No es una regresión de este lote.** La aserción existe desde `24b5153`
(01-09) y el estilo de las luces entró en `ccde35e` (02-09): el spec venía en
rojo desde entonces.

### D-03 · El E2E se borraba a sí mismo el historial que acababa de anotar

La prueba «anota el reporte visitado y lo deja en el Home» navegaba al reporte,
volvía al Home y no encontraba nada. No era el producto: `inyectarPreferencias`
usa `addInitScript`, que corre en **cada carga de página**, así que el segundo
`page.goto` volvía a escribir las preferencias sembradas y pisaba lo anotado.

**Corrección** — la captura por router se prueba en un bloque aparte que no
siembra preferencias, y se verifica leyendo `localStorage`. El render del Home
se prueba sembrando el historial, que es el otro lado del contrato.

---

## Lo que este historial deja como lección

1. **Corregir el token no siempre corrige la pantalla.** A-03 es el caso: había
   un valor por defecto en el modelo de preferencias que se escribía en línea y
   ganaba sobre el token. Cuando un color se puede sobrescribir en runtime, hay
   que buscar **todos** los lugares donde está escrito.
2. **Un umbral que falla no siempre es un color malo.** A-07/A-08 se resolvieron
   separando roles, no aflojando el número. La tentación de bajar el umbral
   hasta que el test pase es real y hay que resistirla.
3. **Antes de corregir un color, buscá quién lo dibuja.** A-13 era código muerto:
   se estaba a punto de re-escalar un color que ningún gráfico renderiza.
4. **Un detector de layout necesita saber qué es correcto.** C-03 y C-04 son el
   mismo error: medir sin modelar la intención. Una tabla con scroll propio y una
   etiqueta truncada no son desbordes, y un test que los reporta se vuelve ruido
   que la gente aprende a ignorar.
5. **Un token no sirve si la pantalla no lo lee.** D-01: se pueden ajustar
   colores durante horas sobre una variable que ningún píxel consume. Medir en el
   navegador antes de decidir el valor cuesta un minuto y evita esa tarde.
6. **Lo que borra `main` no siempre se nota.** B-07 pasó dos veces porque el
   único que ejecuta el script es un build que no corre en cada cambio.
