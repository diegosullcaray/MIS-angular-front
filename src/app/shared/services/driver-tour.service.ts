import { Injectable } from '@angular/core';
import { driver } from 'driver.js';
import type { Config, DriveStep, Driver, Side } from 'driver.js';

/** Debajo de este ancho un globo al costado no entra: se reacomoda arriba o abajo. */
const ANCHO_ANGOSTO = 640;

/** Lo que driver.js pisa en el elemento resaltado y no devuelve al salir. */
const ATRIBUTOS_ARIA = ['aria-haspopup', 'aria-expanded', 'aria-controls'] as const;

/** Rebote del reacomodo: girar el teléfono dispara varios `resize` seguidos. */
const REBOTE_MS = 150;

export type TourConfig = Omit<Config, 'onPopoverRender'>;

/**
 * El mismo elemento que driver.js usa para un paso sin ancla: con ese `id` lo
 * pinta centrado y lo retira al cerrar.
 */
function centroDePantalla(): Element {
  const existente = document.getElementById('driver-dummy-element');
  if (existente) return existente;
  const centro = document.createElement('div');
  centro.id = 'driver-dummy-element';
  Object.assign(centro.style, {
    width: '0', height: '0', pointerEvents: 'none', opacity: '0', position: 'fixed', top: '50%', left: '50%',
  });
  document.body.appendChild(centro);
  return centro;
}

/**
 * Única puerta a driver.js. Pone la configuración por defecto del sistema, el
 * cierre limpio y —lo que más importa en un teléfono— el reacomodo de los
 * globos.
 *
 * **El reacomodo se mide, no se tabula.** En pantallas angostas el lado del
 * globo sale de dónde está el elemento: si vive en la mitad de abajo del
 * viewport, el globo va arriba, y al revés. Antes había una tabla con un caso
 * especial para el rail de sistemas (`#tour-sidebar-icons`), que es el que en
 * móvil se va al borde inferior; eso dejaba a este servicio compartido sabiendo
 * dónde vive un elemento del layout, y no cubría ningún otro.
 *
 * Y se recalcula al cambiar el tamaño. Antes el ancho se leía una sola vez, al
 * arrancar: girar el teléfono a mitad del recorrido dejaba los globos contra el
 * borde equivocado, porque driver.js reposiciona pero nunca vuelve a pasar por
 * acá.
 */
@Injectable({ providedIn: 'root' })
export class DriverTourService {
  private instancia: Driver | null = null;

  /** Los pasos como los declaró el catálogo: de acá sale cada recálculo. */
  private pasos: DriveStep[] = [];

  /** La configuración final, para poder rearmar la instancia al reacomodar. */
  private configuracion: Config | null = null;

  /** Lados que se aplicaron la última vez: si no cambian, reacomodar es solo `refresh()`. */
  private firmaLados = '';

  /** `true` mientras se reemplaza la instancia: ese `destroy()` no es un cierre. */
  private reemplazando = false;

  private quitarEscuchas: (() => void) | null = null;
  private rebote: ReturnType<typeof setTimeout> | null = null;

  /** Todo lo que el recorrido resaltó: driver.js puede volver a tocar cualquiera de ellos. */
  private readonly tocados = new Set<Element>();

  /** El elemento del paso en curso: la limpieza diferida siempre se mide contra este. */
  private resaltado: Element | undefined;

  /** Escucha del clic que hace avanzar un paso `advanceOnClick`. */
  private quitarClic: (() => void) | null = null;

  /** Inicia un recorrido guiado. */
  startTour(config: TourConfig): void {
    this.destroyCurrentTour();

    this.pasos = (config.steps ?? []).map((paso) => this.conResaltadoSeguro(this.sinAnclaOculta(paso), config));

    // Los ciclos de vida van DESPUÉS de `config` a propósito: son los que
    // destruyen la instancia y sueltan las escuchas de tamaño. Si los pisara la
    // configuración de quien llama —que es lo que pasaba antes—, un recorrido
    // con su propio `onDestroyStarted` quedaba sin cierre limpio.
    const pasos = this.reubicar(this.pasos);
    this.firmaLados = this.firma(pasos);
    this.configuracion = {
      ...this.predeterminados(),
      ...config,
      ...(config.steps ? { steps: pasos } : {}),
      ...this.ciclosDeVida(config),
    };

    this.instancia = driver(this.configuracion);
    this.instancia.drive();
    this.escucharCambiosDeTamano();
  }

  /** Atajo para lanzar un recorrido a partir de sus pasos. */
  createQuickTour(steps: DriveStep[], options?: Partial<TourConfig>): void {
    this.startTour({ steps, ...options });
  }

  /** Destruye el recorrido activo y limpia referencias. */
  destroyCurrentTour(): void {
    const instancia = this.instancia;
    if (!instancia) {
      this.limpiar();
      return;
    }
    const fotos = this.fotoAria();
    this.limpiar();
    try {
      instancia.destroy();
    } catch {
      // El recorrido ya estaba destruido: no hay nada que limpiar.
    }
    this.escribirAria(fotos);
  }

  /** Cierra el recorrido y barre popovers residuales, si quedó alguno. */
  forceClose(): void {
    this.destroyCurrentTour();
    for (const resto of document.querySelectorAll('.driver-overlay, .driver-popover')) {
      resto.remove();
    }
  }

  isActive(): boolean {
    return this.instancia !== null;
  }

  /** Fuerza el avance al siguiente paso (útil si se requieren retrasos para esperar animaciones en lugar de `advanceOnClick`). */
  moveNext(): void {
    this.instancia?.moveNext();
  }

  // ─── Resaltado ────────────────────────────────────────────────────────────

  /**
   * Blinda cada paso contra dos defectos de driver.js:
   *
   * - **Clics durante la animación.** driver.js ignora el clic de
   *   `advanceOnClick` mientras dura la transición (400 ms). La app sí lo
   *   recibía —abría la búsqueda o el menú— pero el recorrido no avanzaba, y el
   *   segundo clic del usuario lo volvía a cerrar: el recorrido quedaba trabado.
   *   Acá el avance lo hace una escucha propia sobre el elemento, que corre
   *   después del manejador de la app.
   * - **Atributos que no devuelve.** Marca el elemento con `aria-haspopup`,
   *   `aria-expanded` y `aria-controls` y al pasar de paso los borra, sin
   *   reponer los que el elemento ya tenía: el perfil del header perdía su
   *   `aria-haspopup="true"`. Se guardan antes y se reponen al salir.
   */
  private conResaltadoSeguro(paso: DriveStep, config: TourConfig): DriveStep {
    const avanzaConClic = !!paso.advanceOnClick;
    const propio = paso.onHighlightStarted ?? config.onHighlightStarted;
    return {
      ...paso,
      advanceOnClick: false,
      onHighlightStarted: (elemento, step, opts) => {
        propio?.(elemento, step, opts);
        this.alResaltar(elemento, avanzaConClic);
      },
    };
  }

  private alResaltar(elemento: Element | undefined, avanzaConClic: boolean): void {
    this.quitarClic?.();
    this.quitarClic = null;
    this.resaltado = elemento;

    // Foto de los valores vivos ANTES de que driver.js escriba o borre: con
    // clics rápidos limpia un elemento de dos pasos atrás, así que la foto
    // abarca todo lo resaltado. Lo que quede es lo que la app tenía.
    if (elemento) this.tocados.add(elemento);
    const fotos = this.fotoAria();

    // driver.js termina este paso de forma síncrona después del gancho.
    queueMicrotask(() => {
      this.ordenarMarcas(this.resaltado);
      this.escribirAria(fotos);
    });

    if (elemento && avanzaConClic) {
      const alClic = (): void => {
        this.quitarClic?.();
        this.quitarClic = null;
        this.instancia?.moveNext();
      };
      elemento.addEventListener('click', alClic);
      this.quitarClic = () => elemento.removeEventListener('click', alClic);
    }
  }

  /** Deja la marca de resaltado solo en el elemento del paso actual. */
  private ordenarMarcas(actual: Element | undefined): void {
    // Si el recorrido ya cerró, driver.js limpió todo; un recorrido nuevo no es asunto de este turno.
    if (!this.instancia) return;
    for (const viejo of document.querySelectorAll('.driver-active-element')) {
      if (viejo === actual) continue;
      viejo.classList.remove('driver-active-element', 'driver-no-interaction');
      viejo.parentElement?.classList.remove('driver-active-element-parent', 'driver-active-element-parent-no-scroll');
    }
  }

  private fotoAria(): Map<Element, (string | null)[]> {
    return new Map([...this.tocados].map((el) => [el, ATRIBUTOS_ARIA.map((nombre) => el.getAttribute(nombre))]));
  }

  private escribirAria(fotos: Map<Element, (string | null)[]>): void {
    for (const [el, valores] of fotos) {
      ATRIBUTOS_ARIA.forEach((nombre, i) => {
        const valor = valores[i];
        if (valor === null) el.removeAttribute(nombre);
        else el.setAttribute(nombre, valor);
      });
    }
  }

  /** Destruye una instancia sin perder el ARIA de lo que resaltó: driver.js lo borra al cerrar. */
  private destruirConservandoAria(instancia: Driver): void {
    const fotos = this.fotoAria();
    try {
      instancia.destroy();
    } catch {
      // El recorrido ya estaba destruido: no hay nada que limpiar.
    } finally {
      this.escribirAria(fotos);
    }
  }

  // ─── Reacomodo ────────────────────────────────────────────────────────────

  private esAngosto(): boolean {
    return typeof window !== 'undefined' && window.innerWidth < ANCHO_ANGOSTO;
  }

  /**
   * Los pasos con el lado que corresponde al ancho actual.
   *
   * Devuelve el mismo arreglo si no cambió nada: no tiene sentido recrear la
   * lista en escritorio, que es donde el catálogo ya eligió bien.
   */
  private reubicar(pasos: DriveStep[]): DriveStep[] {
    if (!this.esAngosto()) return pasos;

    let huboCambio = false;
    const reubicados = pasos.map((paso) => {
      if (!paso.popover) return paso;

      const lado = this.ladoAngosto(paso);
      if (!lado || lado === paso.popover.side) return paso;

      huboCambio = true;
      return { ...paso, popover: { ...paso.popover, side: lado, align: 'center' as const } };
    });

    return huboCambio ? reubicados : pasos;
  }

  /**
   * Dónde poner el globo de un paso en pantalla angosta, o `null` si el paso ya
   * está bien.
   *
   * Un paso **sin ancla** devuelve `null` a propósito: driver.js lo pinta
   * centrado, que es justo lo que se busca para una tarjeta que explica algo
   * que no está en esta pantalla.
   */
  private ladoAngosto(paso: DriveStep): Side | null {
    const elemento = this.resolver(paso.element);

    if (elemento) {
      const caja = elemento.getBoundingClientRect();
      // Sin caja no hay nada que medir: el elemento está oculto o todavía sin
      // layout. Ahí manda el respaldo de abajo.
      if (caja.width > 0 || caja.height > 0) {
        return caja.top + caja.height / 2 > window.innerHeight / 2 ? 'top' : 'bottom';
      }
    }

    // Respaldo: un globo al costado nunca entra a 375 px, se mida o no.
    const lado = paso.popover?.side;
    return lado === 'left' || lado === 'right' ? 'bottom' : null;
  }

  /**
   * Un ancla que existe pero no ocupa lugar (una columna oculta en móvil, un
   * panel plegado) se pinta centrada: resaltar un punto de 0×0 deja al usuario
   * mirando la nada. Se decide al llegar al paso, no al arrancar, porque el
   * ancla puede aparecer recién después (un diálogo que abre el paso previo).
   * Si todavía no existe devuelve `null`, y `waitForElement` la sigue esperando.
   */
  private sinAnclaOculta(paso: DriveStep): DriveStep {
    const selector = paso.element;
    if (typeof selector !== 'string') return paso;
    return {
      ...paso,
      element: () => {
        const elemento = document.querySelector(selector);
        if (!elemento) return null as unknown as Element;
        const caja = elemento.getBoundingClientRect();
        return caja.width > 0 || caja.height > 0 ? elemento : centroDePantalla();
      },
    };
  }

  private firma(pasos: DriveStep[]): string {
    return pasos.map((p) => `${p.popover?.side ?? ''}:${p.popover?.align ?? ''}`).join('|');
  }

  private resolver(ancla: DriveStep['element']): Element | null {
    if (!ancla) return null;
    if (typeof ancla === 'string') return document.querySelector(ancla);
    if (typeof ancla === 'function') {
      try {
        return ancla();
      } catch {
        return null;
      }
    }
    return ancla;
  }

  private escucharCambiosDeTamano(): void {
    if (typeof window === 'undefined') return;

    const alCambiar = (): void => {
      if (this.rebote) clearTimeout(this.rebote);
      this.rebote = setTimeout(() => this.reacomodar(), REBOTE_MS);
    };

    window.addEventListener('resize', alCambiar);
    window.addEventListener('orientationchange', alCambiar);

    this.quitarEscuchas = () => {
      window.removeEventListener('resize', alCambiar);
      window.removeEventListener('orientationchange', alCambiar);
    };
  }

  /**
   * Recalcula los lados y vuelve a pintar el paso en el que iba el usuario.
   *
   * Si los lados no cambiaron —lo normal en escritorio— basta con `refresh()`.
   * Si cambiaron, se rearma la instancia: `setSteps()` de driver.js hace
   * `resetState()` y pierde la referencia al overlay y al globo, que quedaban
   * huérfanos encima de la pantalla con cada giro del teléfono.
   */
  private reacomodar(): void {
    const instancia = this.instancia;
    const configuracion = this.configuracion;
    if (!instancia?.isActive() || !configuracion) return;

    const pasos = this.reubicar(this.pasos);
    const firma = this.firma(pasos);
    if (firma === this.firmaLados) {
      instancia.refresh();
      return;
    }

    const indice = instancia.getActiveIndex() ?? 0;
    this.firmaLados = firma;
    this.configuracion = { ...configuracion, steps: pasos };

    this.reemplazando = true;
    try {
      this.destruirConservandoAria(instancia);
    } finally {
      this.reemplazando = false;
    }
    this.instancia = driver(this.configuracion);
    this.instancia.drive(indice);
  }

  private limpiar(): void {
    this.tocados.clear();
    this.resaltado = undefined;
    this.quitarClic?.();
    this.quitarClic = null;
    this.instancia = null;
    this.configuracion = null;
    this.firmaLados = '';

    if (this.rebote) {
      clearTimeout(this.rebote);
      this.rebote = null;
    }

    this.quitarEscuchas?.();
    this.quitarEscuchas = null;
  }

  private predeterminados(): Partial<Config> {
    return {
      animate: true,
      smoothScroll: true,
      allowKeyboardControl: true,
      skipMissingElement: true,
      stagePadding: this.esAngosto() ? 4 : 8,
      stageRadius: 10,
      overlayColor: 'rgba(15, 23, 42, 0.65)',
      allowClose: true,
      showProgress: true,
      showButtons: ['next', 'previous', 'close'],
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Finalizar',
      progressText: '{{current}} de {{total}}',
    };
  }

  /** Cierre limpio, encadenando lo que haya pedido quien llama. */
  private ciclosDeVida(config: TourConfig): Partial<Config> {
    return {
      onDestroyStarted: (element, step, opts) => {
        config.onDestroyStarted?.(element, step, opts);
        const fotos = this.fotoAria();
        this.limpiar();
        opts?.driver?.destroy?.();
        this.escribirAria(fotos);
      },
      onDestroyed: (element, step, opts) => {
        // Reemplazar la instancia al reacomodar no es cerrar el recorrido.
        if (this.reemplazando) return;
        config.onDestroyed?.(element, step, opts);
        this.limpiar();
      },
    };
  }
}
