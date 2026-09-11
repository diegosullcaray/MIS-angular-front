import { Injectable } from '@angular/core';
import { driver } from 'driver.js';
import type { Config, DriveStep, Driver, Side } from 'driver.js';

/** Debajo de este ancho un globo al costado no entra: se reacomoda arriba o abajo. */
const ANCHO_ANGOSTO = 640;

/** Rebote del reacomodo: girar el teléfono dispara varios `resize` seguidos. */
const REBOTE_MS = 150;

export type TourConfig = Omit<Config, 'onPopoverRender'>;

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

  private quitarEscuchas: (() => void) | null = null;
  private rebote: ReturnType<typeof setTimeout> | null = null;

  /** Inicia un recorrido guiado. */
  startTour(config: TourConfig): void {
    this.destroyCurrentTour();

    this.pasos = config.steps ?? [];

    // Los ciclos de vida van DESPUÉS de `config` a propósito: son los que
    // destruyen la instancia y sueltan las escuchas de tamaño. Si los pisara la
    // configuración de quien llama —que es lo que pasaba antes—, un recorrido
    // con su propio `onDestroyStarted` quedaba sin cierre limpio.
    const finalConfig: Config = {
      ...this.predeterminados(),
      ...config,
      ...(config.steps ? { steps: this.reubicar(this.pasos) } : {}),
      ...this.ciclosDeVida(config),
    };

    this.instancia = driver(finalConfig);
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
    this.limpiar();
    if (!instancia) return;

    try {
      instancia.destroy();
    } catch {
      // El recorrido ya estaba destruido: no hay nada que limpiar.
    }
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

  /** Recalcula los lados y vuelve a pintar el paso en el que iba el usuario. */
  private reacomodar(): void {
    const instancia = this.instancia;
    if (!instancia?.isActive()) return;

    const indice = instancia.getActiveIndex() ?? 0;
    instancia.setSteps(this.reubicar(this.pasos));
    instancia.moveTo(indice);
  }

  private limpiar(): void {
    this.instancia = null;

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
        this.limpiar();
        opts?.driver?.destroy?.();
      },
      onDestroyed: (element, step, opts) => {
        config.onDestroyed?.(element, step, opts);
        this.limpiar();
      },
    };
  }
}
