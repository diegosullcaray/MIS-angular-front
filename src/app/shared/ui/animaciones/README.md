# `appAnimar` — animaciones del Host

Todo el movimiento con GSAP pasa por esta directiva. Un módulo elige una animación del catálogo
`ANIMACIONES` por su nombre; **no importa `gsap` ni escribe tweens propios**. Así el ritmo de la
app se decide en un solo archivo y los reportes no acumulan efectos.

## Uso

```typescript
// El número de `../` depende de dónde viva tu componente; no hay alias de rutas en el proyecto.
import { AnimarDirective } from '…/shared/ui/animaciones/animar.directive';

@Component({
  imports: [AnimarDirective],
  // ...
})
```

```html
<section appAnimar="entrada">…</section>

<!-- Los hijos directos entran uno tras otro; `retraso` en segundos. -->
<div appAnimar="escalonado" [retraso]="0.1">
  <h1>…</h1>
  <p-button … />
</div>
```

## Catálogo

| Nombre | Qué hace | Para qué |
|---|---|---|
| `entrada` | Aparece subiendo 16 px, 0.6 s | Bloques, tarjetas, paneles |
| `escalonado` | Los hijos directos entran en cascada | Formularios cortos, pocas tarjetas |
| `fundido` | Solo opacidad, 0.5 s | Contenedores con hijos `position: fixed` (sidebar, header) |
| `aparecer` | Entra con un pequeño rebote | La mascota cuando saluda (bienvenida, novedades) |
| `zoom-lento` | La imagen se acerca durante 6 s | Fotos de fondo (login) |

`entrada`, `escalonado` y `aparecer` usan `transform`: en un ancestro de algo con
`position: fixed`, ese hijo se descoloca mientras dura. Ahí va `fundido`.

## Dónde se usa

Login, shell (sidebar y header), panel de novedades y bienvenida de Pachi. Los módulos y
reportes no usan `appAnimar`: su carga la cuentan los esqueletos.

## Cambios de panel: no van acá

Cambiar de módulo o reporte (ruta) y cambiar de pestaña (`p-tabs`) animan solos, sin tocar
ninguna pantalla. Viven en `src/assets/styles/base/animations.css`:

- **Ruta:** View Transitions del navegador (`withViewTransitions()` en `app.config.ts`). Solo se
  mueve `.shell-content-inner`; header y sidebar quedan quietos. Salida 120 ms, entrada 240 ms.
- **Pestaña:** el panel que se muestra entra en 200 ms.

Arrancan desde 0.4 de opacidad y 6 px: el cambio se nota sin hacer esperar a quien trabaja.
Con movimiento reducido queda solo el fundido.

## Reglas

- **Solo entradas, una vez.** Nada de animaciones en bucle ni al actualizar datos: una tabla o un
  KPI que se mueve cada vez que llega una consulta cansa y confunde la lectura.
- **Nunca en filas de tabla ni en celdas.** El esqueleto de la tabla ya comunica la carga
  (ver `governance/docs/components/estandar-reportes.md`).
- **Una animación nueva se suma al catálogo**, no en la pantalla que la necesita.
- **Movimiento reducido:** con `prefers-reduced-motion` la directiva no anima y el contenido
  aparece en su estado final. No hace falta nada más en la pantalla.
- Al destruirse revierte lo aplicado (`gsap.context().revert()`), así no deja estilos en línea.
