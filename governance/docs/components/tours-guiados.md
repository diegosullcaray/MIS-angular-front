# Recorridos guiados

El sistema explica sus propias pantallas con recorridos sobre la interfaz real: se oscurece todo menos el elemento del paso y un globo cuenta qué es, con el personaje de la marca al lado. Corre sobre [driver.js](https://driverjs.com/), envuelto en `DriverTourService`.

## Las piezas

| Pieza | Dónde | Qué hace |
|---|---|---|
| `DriverTourService` | `src/app/shared/services/driver-tour.service.ts` | única puerta a driver.js: configuración por defecto, cierre limpio y ajustes para móvil |
| Catálogo por módulo | `*-tour.service.ts` en cada módulo | declara los pasos de ese recorrido |
| `NovedadesTourService` | `src/app/pages/modules/home/services/novedades-tour.service.ts` | catálogo de novedades del Home; cada una es un recorrido |
| `app-panel-novedades` | `src/app/pages/modules/home/ui/panel-novedades/` | el panel lateral desde donde se lanzan |
| Tema del globo | `src/assets/styles/vendor/driver.css` | paleta del sistema y el personaje |
| Personaje | `src/assets/images/fc/tours/` | recortes del personaje oficial de la marca |

`DriverTourService` es el único lugar que importa `driver.js`. Un módulo que lo importe por su cuenta se saltea el cierre limpio (`forceClose()` elimina popovers residuales) y los ajustes de móvil.

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

## El personaje

El globo lleva al personaje de la marca, que es quien "da" la guía. Se arma dentro de `description`, que driver.js pinta con `innerHTML`:

```typescript
function conMascota(texto: string, pose = 'guia'): string {
  return `<span class="mis-tour-fila"><img class="mis-tour-mascota mis-tour-mascota--${pose}" src="…/mascota-${pose}.png" alt="" aria-hidden="true"><span class="mis-tour-texto">${texto}</span></span>`;
}
```

Dos condiciones que no son negociables:

- **El texto es nuestro.** Se pinta con `innerHTML`: nada que venga del usuario o del backend entra ahí.
- **La imagen es decorativa** (`alt=""`, `aria-hidden`): el mensaje lo lleva el texto. Un lector de pantalla no debe oír "imagen de puma" en cada paso.

Las piezas de `assets/images/fc/tours/` son recortes del render oficial de la marca, no ilustraciones nuevas. Antes de agregar una pose conviene mirar el peso: son PNG con transparencia y el [control de activos](../../scripts/README.md) los marca por encima de 500 kB (`npm run audit:activos`).

## Agregar una novedad al Home

1. Sumar la entrada al catálogo de `NovedadesTourService` con `id`, `titulo`, `resumen`, `icono`, `fecha` y sus `pasos`.
2. Apuntar cada paso a un ancla estable; si la pantalla no tiene ninguna, agregar el `aria-label` que le falta —que además mejora la accesibilidad— antes que un `id` de tour.
3. Correr `npm run audit:anclas`.

El panel ordena solo por `fecha`, y `esNueva()` decide la etiqueta "Nuevo" con una ventana de 30 días.

## Ver también

- [Ventanas y diálogos](./ventanas-y-dialogos.md) — el cromo que estos recorridos explican
- [Accesibilidad](./accessibility.md)
- Guía operativa: [`skills/mis-tours-guiados`](../../skills/mis-tours-guiados/SKILL.md)
