import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/** Filas del cuerpo que se ven a la vez en cualquier tabla del Host; el resto, con scroll dentro. */
export const MAX_FILAS_VISIBLES = 16;

/**
 * Tope de alto de una tabla, como fracción de la altura de la ventana: con tarjetas KPI, pestañas
 * o filtros arriba, ni siquiera 16 filas deben hacer scrollear el panel en una pantalla baja.
 */
export const FRACCION_MAX_ALTO_VENTANA = 0.62;

/** Con `hastaElFondo` fuera de un panel: espacio que se deja bajo la tabla. */
export const RESERVA_PIE_PX = 48;
/** Con `hastaElFondo`: la tabla nunca baja de este alto, aunque la ventana sea muy baja. */
export const ALTO_MINIMO_FONDO_PX = 240;

/**
 * Contenedor que de verdad hace scroll: en escritorio, el más externo con `overflow-y` auto/scroll
 * (el `main` del shell; los de adentro crecen con el contenido); en móvil, el cuerpo de la ventana.
 */
function contenedorDeScroll(el: HTMLElement): HTMLElement | null {
  // En móvil la ventana mide lo que cabe en pantalla y el que scrollea es su cuerpo (ver
  // `ventana.css`): la tabla se mide contra él, así llena el panel sin hacerlo scrollear.
  const cuerpo = el.closest<HTMLElement>('.mis-window-body');
  if (cuerpo && window.matchMedia?.('(max-width: 639.98px)').matches) return cuerpo;
  let externo: HTMLElement | null = null;
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(p).overflowY)) externo = p;
  }
  return externo;
}

/** Alto que ocupa, dentro de `hasta`, lo que queda debajo de `el`: hermanos de abajo, rellenos y bordes. */
export function espacioDebajo(el: HTMLElement, hasta: HTMLElement): number {
  let total = 0;
  for (let nodo = el; nodo !== hasta && nodo.parentElement; nodo = nodo.parentElement) {
    const padre = nodo.parentElement;
    const caja = nodo.getBoundingClientRect();
    let fin = caja.bottom + (parseFloat(getComputedStyle(nodo).marginBottom) || 0);
    for (let h = nodo.nextElementSibling; h; h = h.nextElementSibling) {
      const r = h.getBoundingClientRect();
      // Solo lo que va debajo; lo que va al costado (layouts en fila) no resta alto.
      if (r.height > 0 && r.top >= caja.bottom - 1) {
        fin = Math.max(fin, r.bottom + (parseFloat(getComputedStyle(h).marginBottom) || 0));
      }
    }
    const estilo = getComputedStyle(padre);
    total += fin - caja.bottom + (parseFloat(estilo.paddingBottom) || 0) + (parseFloat(estilo.borderBottomWidth) || 0);
  }
  return total;
}

/**
 * Limita el alto de un `p-table` a `MAX_FILAS_VISIBLES` filas del cuerpo y a
 * `FRACCION_MAX_ALTO_VENTANA` de la ventana (lo que sea menor): pasado eso, la tabla saca su propio
 * scroll con el encabezado fijo. Si entra, conserva su alto natural. Se mide hasta el borde de la
 * última fila visible, y se vuelve a medir cuando cambian las filas o el tamaño.
 *
 * Con `hastaElFondo` la tabla crece hasta el pie del panel (descontando lo que tenga debajo). En
 * `'auto'` lo hace solo si es la única tabla de su pestaña (o del panel, sin pestañas), sin
 * paginador, y nunca queda más baja que con el tope normal.
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

  readonly hastaElFondo = input<boolean | 'auto'>(false);

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
      // Lo de debajo (leyendas, gráficos) puede cambiar de alto sin tocar la tabla.
      const panel = this.host.nativeElement.closest<HTMLElement>('.mis-window-body');
      if (panel?.firstElementChild) redimension?.observe(panel.firstElementChild);
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

  ajustar(): void {
    const contenedor = this.host.nativeElement.querySelector<HTMLElement>('.p-datatable-table-container');
    if (!contenedor) return;
    this.altoOriginal ??= contenedor.style.maxHeight;

    const modo = this.hastaElFondo();
    const fondo = modo === true || (modo === 'auto' && this.esUnicaTabla()) ? this.altoHastaElFondo(contenedor) : null;
    if (fondo !== null && modo === true) {
      this.fijar(contenedor, fondo);
      return;
    }

    const normal = this.altoNormal(contenedor);
    if (normal === undefined) return;
    if (fondo !== null) {
      // En 'auto', nunca más baja que sin llenar (p. ej. con un gráfico grande debajo).
      this.fijar(contenedor, Math.max(fondo, normal ?? contenedor.scrollHeight));
      return;
    }
    if (normal === null) contenedor.style.maxHeight = this.altoOriginal;
    else this.fijar(contenedor, normal);
  }

  /** Tope por filas y por alto de ventana; `null` si la tabla entra; `undefined` sin layout. */
  private altoNormal(contenedor: HTMLElement): number | null | undefined {
    const filas = contenedor.querySelectorAll<HTMLElement>('tbody.p-datatable-tbody > tr');
    const limite = this.maxFilas();
    const tope = Math.round(window.innerHeight * FRACCION_MAX_ALTO_VENTANA);

    let alto: number;
    if (filas.length > limite) {
      const ultima = filas[limite - 1].getBoundingClientRect();
      alto = ultima.bottom - contenedor.getBoundingClientRect().top + contenedor.scrollTop;
      if (alto <= 0) return undefined;
    } else {
      alto = contenedor.scrollHeight;
    }
    if (tope > 0 && alto > tope) return tope;
    return filas.length > limite ? alto : null;
  }

  /** Única tabla de su pestaña (o de su panel, sin pestañas), sin paginador y fuera de diálogos. */
  private esUnicaTabla(): boolean {
    const host = this.host.nativeElement;
    if (host.closest('.p-dialog')) return false;
    const ambito = host.closest('.p-tabpanel') ?? host.closest('.mis-window-body');
    return !!ambito && ambito.querySelectorAll('.p-datatable').length === 1 && !ambito.querySelector('.p-paginator');
  }

  /** Alto desde el borde superior de la tabla hasta el pie visible de la pantalla; `null` sin layout. */
  private altoHastaElFondo(contenedor: HTMLElement): number | null {
    const caja = contenedor.getBoundingClientRect();
    if (!window.innerHeight || (caja.top === 0 && contenedor.scrollHeight === 0)) return null;
    const scroll = contenedorDeScroll(this.host.nativeElement);
    let disponible: number;
    if (scroll) {
      const arriba = caja.top - scroll.getBoundingClientRect().top + scroll.scrollTop;
      disponible = scroll.clientHeight - arriba - espacioDebajo(contenedor, scroll);
    } else {
      disponible = window.innerHeight - caja.top - RESERVA_PIE_PX;
    }
    return Math.max(ALTO_MINIMO_FONDO_PX, Math.floor(disponible));
  }

  private fijar(contenedor: HTMLElement, alto: number): void {
    contenedor.style.maxHeight = `${Math.ceil(alto)}px`;
    contenedor.style.overflowY = 'auto';
  }
}
