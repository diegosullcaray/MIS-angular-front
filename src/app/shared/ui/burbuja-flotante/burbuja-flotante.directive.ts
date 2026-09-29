import { DOCUMENT, DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

type Ubicacion = 'arriba' | 'derecha';

/** Contenedor con scroll más cercano: fuera de él el ancla no se ve y la burbuja se oculta. */
function contenedorConScroll(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p; p = p.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) return p;
  }
  return null;
}

/** Posición (en el viewport) de la burbuja junto al ancla, sin salirse del contenedor visible. */
export function posicionBurbuja(
  ancla: DOMRect,
  burbuja: { width: number; height: number },
  limites: { top: number; left: number; right: number },
  ubicacion: Ubicacion,
  separacion: number,
): { top: number; left: number } {
  if (ubicacion === 'derecha') {
    return { top: ancla.top, left: ancla.right + separacion };
  }
  const centro = ancla.left + ancla.width / 2 - burbuja.width / 2;
  const left = Math.min(Math.max(centro, limites.left + separacion), limites.right - burbuja.width - separacion);
  // Sin lugar arriba (panel desplazado) se queda al borde del contenedor en vez de salirse.
  return { top: Math.max(ancla.top - burbuja.height - separacion, limites.top + separacion), left };
}

/**
 * Burbuja de diálogo que flota por delante de la página, pegada a un ancla (la mascota): se lleva
 * al `body` —como un `appendTo="body"`— para que ni el scroll ni el vidrio (`backdrop-filter`) del
 * panel la recorten, y no ocupa lugar en el layout. En escritorio va encima del ancla; en pantallas
 * más chicas, a su derecha. Se oculta cuando el ancla sale del área visible de su contenedor con scroll.
 */
@Directive({ selector: '[appBurbujaFlotante]', standalone: true })
export class BurbujaFlotanteDirective {
  /** Elemento al que se pega la burbuja. */
  readonly ancla = input.required<HTMLElement>({ alias: 'appBurbujaFlotante' });
  /** Desde qué ancho la burbuja va encima del ancla; por debajo, a su derecha. */
  readonly arribaDesde = input('(min-width: 1024px)');
  readonly separacion = input(6);

  constructor() {
    const el: HTMLElement = inject(ElementRef).nativeElement;
    const doc = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const ancla = this.ancla();
      const vista = doc.defaultView!;
      const medio = vista.matchMedia?.(this.arribaDesde());
      const contenedor = contenedorConScroll(ancla);
      doc.body.appendChild(el);
      // z 20: por delante del contenido, por debajo del header y la máscara del menú lateral (30-40)
      // y de los overlays de PrimeNG (diálogos, selects).
      Object.assign(el.style, { position: 'fixed', top: '0', left: '0', zIndex: '20', pointerEvents: 'none' });

      let cuadro = 0;
      const ubicar = () => {
        cuadro = 0;
        const a = ancla.getBoundingClientRect();
        const c = contenedor?.getBoundingClientRect() ?? { top: 0, bottom: vista.innerHeight, left: 0, right: vista.innerWidth };
        const ubicacion: Ubicacion = (medio?.matches ?? true) ? 'arriba' : 'derecha';
        el.dataset['ubicacion'] = ubicacion;
        const b = el.getBoundingClientRect();
        const { top, left } = posicionBurbuja(a, b, c, ubicacion, this.separacion());
        const visible = a.width > 0 && a.top >= c.top && a.bottom <= c.bottom;
        el.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
        el.style.visibility = visible ? 'visible' : 'hidden';
      };
      const programar = () => {
        if (!cuadro) cuadro = vista.requestAnimationFrame(ubicar);
      };

      const observador = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(programar);
      for (const o of [ancla, ancla.parentElement, contenedor?.firstElementChild, el]) if (o) observador?.observe(o);
      vista.addEventListener('scroll', programar, true);
      vista.addEventListener('resize', programar);
      medio?.addEventListener('change', programar);
      ubicar();

      destroyRef.onDestroy(() => {
        if (cuadro) vista.cancelAnimationFrame(cuadro);
        observador?.disconnect();
        vista.removeEventListener('scroll', programar, true);
        vista.removeEventListener('resize', programar);
        medio?.removeEventListener('change', programar);
        el.remove();
      });
    });
  }
}
