# Recorridos guiados

El sistema explica sus propias pantallas con recorridos sobre la interfaz real: se oscurece todo menos el elemento del paso y un globo cuenta qué es, con **Pachi** —el personaje de la marca— al lado. Corre sobre [driver.js](https://driverjs.com/), envuelto en `DriverTourService`.

## Las piezas

| Pieza | Dónde | Qué hace |
|---|---|---|
| `DriverTourService` | `src/app/shared/services/driver-tour.service.ts` | única puerta a driver.js: configuración por defecto, cierre limpio y el reacomodo de los globos en pantalla angosta |
| Catálogo por módulo | `*-tour.service.ts` en cada módulo | declara los pasos de ese recorrido |
| `NovedadesTourService` | `src/app/pages/modules/home/services/novedades-tour.service.ts` | catálogo de novedades del Home; cada una es un recorrido |
| `app-panel-novedades` | `src/app/pages/modules/home/ui/panel-novedades/` | el panel lateral desde donde se lanzan |
| Tema del globo | `src/assets/styles/vendor/driver.css` | paleta del sistema y el personaje |
| Pachi | `src/assets/images/fc/tours/` | recortes del personaje oficial de la marca, una imagen por pose |
| Bienvenida | `src/app/pages/modules/home/ui/bienvenida-dialog/` | el saludo de Pachi al entrar, una sola vez |

`DriverTourService` es el único lugar que importa `driver.js`. Un módulo que lo importe por su cuenta se saltea el cierre limpio (`forceClose()` elimina popovers residuales) y el reacomodo de abajo.

## Pantalla angosta: el lado se mide, no se tabula

Por debajo de 640 px un globo al costado no entra. El servicio decide el lado
**midiendo dónde está el ancla**: si su centro cae en la mitad de abajo del
viewport, el globo va `top`; si no, `bottom`. Siempre `align: 'center'`.

Antes había una tabla con un caso especial para `#tour-sidebar-icons` —el rail,
que en móvil se va al borde inferior—. Eso dejaba a un servicio de `shared/`
sabiendo dónde vive un elemento del layout, y no cubría ningún otro elemento del
pie.

**Y se recalcula.** `resize` y `orientationchange` vuelven a medir y reponen el
paso activo (`setSteps()` + `moveTo()`). Girar el teléfono a mitad del recorrido
dejaba los globos contra el borde equivocado: el ancho se leía una sola vez, al
arrancar.

## Pasos sin ancla

Un paso puede no traer `element`. driver.js lo pinta **centrado**, sin resaltar
nada, y es lo correcto cuando la novedad habla de algo que no está en esta
pantalla — los filtros viven en los reportes, no en el Home.

Dos cosas a tener en cuenta:

- `verificar-anclas-tour.mjs` cuenta pasos por las apariciones de `element:`, así
  que **los pasos sin ancla no entran en ese total**. No es que falten: no hay
  nada que verificar.
- Sin ancla no se declara `side`: no hay contra qué ubicarlo.

## Las anclas: selector estable, no `id` de tour

Cada paso encuentra su elemento por selector CSS **en tiempo de ejecución**. La regla del repositorio, registrada en [ADR-0004](../architecture/adr/ADR-0004-anclas-de-tour-por-selector-estable.md):

> Un recorrido apunta a lo que ya identifica al elemento —su `id` de negocio, su `aria-label`, su clase de componente—. No se agregan `id="tour-*"` a las plantillas de los módulos solo para que un tour tenga dónde agarrarse.

```typescript
const ANCLA = {
  rail: '#tour-sidebar-icons',
  perfil: 'header [aria-haspopup="true"]',
  comunicados: 'header button[aria-label="Comunicados del sistema"]',
} as const;
```

El `aria-label` es doblemente útil: describe el control para un lector de pantalla **y** lo hace localizable. Si desaparece, el tour se rompe — y esa rotura la detecta la compuerta, no el usuario.

## La compuerta

```bash
npm run audit:anclas          # informe
npm run audit:anclas -- --check
```

`verificar-anclas-tour.mjs` resuelve cada selector contra las plantillas y las hojas de estilo reales, y reporta:

- **Ancla rota**: el `id`, la clase o el atributo del paso no existe en `src/`. Es error: bloquea.
- **Ancla huérfana**: un `id="tour-*"` que quedó en una plantilla y ningún paso usa. Es aviso: sobra código.
- **Ancla externa**: apunta a marcado de PrimeNG o del propio driver.js (`.p-*`, `.driver-*`). No se puede verificar contra `src/`, así que se informa aparte.

Existe porque el modo de falla es silencioso: driver.js tiene `skipMissingElement` activo, así que un paso sin elemento no lanza ningún error — el recorrido simplemente se saltea ese punto y nadie se entera.

## Pachi

El globo lleva a **Pachi**, que es quien "da" la guía y se presenta por su nombre en el primer paso de cada recorrido. Se arma dentro de `description`, que driver.js pinta con `innerHTML`:

```typescript
function conPachi(texto: string, pose: PosePachi = 'guia'): string {
  return `<span class="mis-tour-fila"><img class="mis-tour-mascota mis-tour-mascota--${pose}" src="…/mascota-${pose}.png" alt="" aria-hidden="true"><span class="mis-tour-texto">${texto}</span></span>`;
}
```

Dos condiciones que no son negociables:

- **El texto es nuestro.** Se pinta con `innerHTML`: nada que venga del usuario o del backend entra ahí.
- **La imagen es decorativa** (`alt=""`, `aria-hidden`): el mensaje lo lleva el texto. Un lector de pantalla no debe oír "imagen de puma" en cada paso.

Las piezas de `assets/images/fc/tours/` son recortes del render oficial de la marca, no ilustraciones nuevas.

**Pendiente conocido — el peso.** Las doce poses son PNG de 1024×1024 y suman
**7,3 MB**; cada una pasa el umbral de 500 kB que marca `npm run audit:activos`.
En pantalla se pintan entre 64 y 132 px, o sea unas ocho veces más chicas de lo
que pesan. Redimensionarlas a ~256 px sería la mejora más grande que le queda al
recorrido en un teléfono. Está registrado en INC-2026-09-11-04.

**El control de activos no las ve.** `conPachi()` arma la ruta en tiempo de
ejecución (`${MASCOTA}${pose}.png`), así que el escáner las lista como "sin
uso". No lo están: borrarlas rompe el recorrido.

## Agregar una novedad al Home

1. Sumar la entrada al catálogo de `NovedadesTourService` con `id`, `titulo`, `resumen`, `icono`, `fecha` y sus `pasos`.
2. Apuntar cada paso a un ancla estable; si la pantalla no tiene ninguna, agregar el `aria-label` que le falta —que además mejora la accesibilidad— antes que un `id` de tour.
3. Correr `npm run audit:anclas`.

El panel ordena solo por `fecha`, y `esNueva()` decide la etiqueta "Nuevo" con una ventana de 30 días.

**El panel se aparta del recorrido.** Está fijo encima de la pantalla, y en
angosto ocupa todo el ancho: si quedara abierto, el paso resaltaría algo que el
propio panel está tapando. Por eso `verGuia()` lo cierra antes de arrancar,
salvo que la novedad declare `requierePanel: true` —solo la que habla del panel
mismo—.

## La bienvenida

`app-bienvenida-dialog` (en el Home) saluda con Pachi la primera vez y lista las
cuatro novedades más recientes del mismo catálogo. Su botón principal abre el
panel.

Vive en el Home y no en el shell porque `LoginComponent` navega a
`/app/dashboard`: toda sesión empieza ahí, y así el diálogo lee el catálogo
directo, sin que una pantalla del layout importe de un módulo. La contrapartida
asumida es que quien entre por enlace directo a un reporte la verá recién al
pasar por el Home.

Se marca como vista en `mis.preferencias` (`bienvenida.vista`). Mientras no se
cierre, **el comunicado espera**: dos modales apilados en el primer ingreso es
peor que ninguno. Y con la política de borrado total al cerrar sesión, "una sola
vez" dura hasta el próximo logout — ver [preferencias de sesión](../architecture/session-preferences.md).

## Ver también

- [Ventanas y diálogos](./ventanas-y-dialogos.md) — el cromo que estos recorridos explican
- [Accesibilidad](./accessibility.md)
- Guía operativa: [`skills/mis-tours-guiados`](../../skills/mis-tours-guiados/SKILL.md)
