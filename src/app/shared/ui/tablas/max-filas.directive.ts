import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/** Filas del cuerpo que se ven a la vez en cualquier tabla del Host; el resto, con scroll dentro. */
export const MAX_FILAS_VISIBLES = 16;

/**
 * Tope de alto de una tabla, como fracción de la altura de la ventana: con tarjetas KPI, pestañas
 * o filtros arriba, ni siquiera 16 filas deben hacer scrollear el panel en una pantalla baja.
 */
export const FRACCION_MAX_ALTO_VENTANA = 0.62;

/**
 * Limita el alto de un `p-table` a `MAX_FILAS_VISIBLES` filas del cuerpo y, además, a
 * `FRACCION_MAX_ALTO_VENTANA` de la altura de la ventana (lo que sea menor): pasado eso, el
 * contenedor de la tabla (`.p-datatable-table-container`) saca su propio scroll vertical y el
 * encabezado queda fijo arriba, en vez de hacer scrollear el panel. Si la tabla entra, conserva su
 * alto natural.
 *
 * El alto no es un número fijo de píxeles: se mide hasta el borde inferior de la última fila visible, así
 * encabezados de varias filas o celdas más altas no cortan una fila por la mitad. Se vuelve a
 * medir cuando cambian las filas (datos, página, filtros) o el ancho de la tabla.
 *
 * ```html
 * <p-table appMaxFilas [scrollable]="true" …>
 * ```
 */
@Directive({
  selector: 'p-table[appMaxFilas]',
  standalone: true,
  host: { class: 'mis-max-filas' },
})
export class MaxFilasDirective {
  readonly maxFilas = input(MAX_FILAS_VISIBLES, {
    alias: 'appMaxFilas',
    transform: (valor: unknown) => (Number(valor) > 0 ? Number(valor) : MAX_FILAS_VISIBLES),
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  /** `max-height` que la tabla ya traía (p. ej. un `scrollHeight` propio), para devolverlo. */
  private altoOriginal: string | null = null;
  private cuadro = 0;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const programar = () => {
        cancelAnimationFrame(this.cuadro);
        this.cuadro = requestAnimationFrame(() => this.ajustar());
      };

      const mutaciones = new MutationObserver(programar);
      mutaciones.observe(this.host.nativeElement, { childList: true, subtree: true });

      const redimension = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(programar);
      redimension?.observe(this.host.nativeElement);
      // El tope depende de la altura de la ventana.
      window.addEventListener('resize', programar);

      this.ajustar();
      destroyRef.onDestroy(() => {
        cancelAnimationFrame(this.cuadro);
        mutaciones.disconnect();
        redimension?.disconnect();
        window.removeEventListener('resize', programar);
      });
    });
  }

  /** Recalcula el alto máximo del contenedor según la fila `maxFilas`. */
  ajustar(): void {
    const contenedor = this.host.nativeElement.querySelector<HTMLElement>('.p-datatable-table-container');
    if (!contenedor) return;
    this.altoOriginal ??= contenedor.style.maxHeight;

    const filas = contenedor.querySelectorAll<HTMLElement>('tbody.p-datatable-tbody > tr');
    const limite = this.maxFilas();
    const tope = Math.round(window.innerHeight * FRACCION_MAX_ALTO_VENTANA);

    let alto: number;
    if (filas.length > limite) {
      const ultima = filas[limite - 1].getBoundingClientRect();
      alto = ultima.bottom - contenedor.getBoundingClientRect().top + contenedor.scrollTop;
      // Sin layout (p. ej. en pruebas o con la tabla oculta) no hay nada que medir.
      if (alto <= 0) return;
    } else {
      alto = contenedor.scrollHeight;
    }

    if (tope > 0 && alto > tope) alto = tope;
    else if (filas.length <= limite) {
      contenedor.style.maxHeight = this.altoOriginal;
      return;
    }
    contenedor.style.maxHeight = `${Math.ceil(alto)}px`;
    contenedor.style.overflowY = 'auto';
  }
}
