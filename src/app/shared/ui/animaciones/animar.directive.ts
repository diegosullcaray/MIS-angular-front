import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';
import { gsap } from 'gsap';

interface Animacion {
  readonly desde: gsap.TweenVars;
  readonly duracion: number;
  /** Anima los hijos directos uno tras otro, en vez del elemento. */
  readonly escalonado?: number;
  readonly ease?: string;
}

/**
 * Catálogo cerrado del movimiento del Host. Los módulos eligen un nombre; no
 * escriben tweens. Sumar una animación es sumar una entrada acá, no en la pantalla.
 */
export const ANIMACIONES = {
  /** Aparece subiendo apenas: bloques, tarjetas, paneles. */
  entrada: { desde: { autoAlpha: 0, y: 16 }, duracion: 0.6 },
  /** Los hijos entran en cascada: formularios cortos, listas de pocas tarjetas. */
  escalonado: { desde: { autoAlpha: 0, y: 12 }, duracion: 0.4, escalonado: 0.06 },
  /**
   * Solo opacidad. Para contenedores con hijos `position: fixed` (sidebar,
   * header): un `transform` en el ancestro los descoloca mientras dura.
   */
  fundido: { desde: { autoAlpha: 0 }, duracion: 0.5, ease: 'power1.out' },
  /** Entra con un pequeño rebote: la mascota cuando saluda. */
  aparecer: { desde: { autoAlpha: 0, scale: 0.8, rotate: -4 }, duracion: 0.4, ease: 'back.out(1.4)' },
  /** Acercamiento lento de una foto de fondo al entrar. */
  'zoom-lento': { desde: { scale: 1.08 }, duracion: 6, ease: 'power1.out' },
} satisfies Record<string, Animacion>;

export type NombreAnimacion = keyof typeof ANIMACIONES;

/** La misma curva que usaba el login en CSS: arranca rápido y se posa suave. */
const EASE_POR_DEFECTO = 'expo.out';

/**
 * Corre una animación del catálogo sobre `el` (o sus hijos, si es escalonada). Sirve también para
 * lo que aparece más de una vez, como la franja de filtros al abrirse. Devuelve el contexto para revertir.
 */
export function animar(el: HTMLElement, nombre: NombreAnimacion, retraso = 0): gsap.Context | undefined {
  const a: Animacion = ANIMACIONES[nombre];
  const reducir = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reducir && !('autoAlpha' in a.desde)) return undefined;

  return gsap.context(() => {
    gsap.from(a.escalonado ? el.children : el, {
      ...(reducir ? { autoAlpha: 0 } : a.desde),
      duration: reducir ? 0.2 : a.duracion,
      stagger: a.escalonado,
      ease: a.ease ?? EASE_POR_DEFECTO,
      delay: retraso,
      clearProps: 'opacity,visibility,transform',
    });
  }, el);
}

/**
 * `<div appAnimar="entrada">` — animación de entrada, una vez, al renderizar.
 *
 * Con `prefers-reduced-motion` queda solo un fundido corto, sin desplazamiento ni
 * escala; lo que no tiene fundido (`zoom-lento`) no anima. Al destruirse revierte lo que haya aplicado, así no deja estilos en línea.
 */
@Directive({ selector: '[appAnimar]', standalone: true })
export class AnimarDirective {
  readonly appAnimar = input.required<NombreAnimacion>();
  /** Segundos de espera antes de empezar, para coordinar varias en una pantalla. */
  readonly retraso = input(0);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    let contexto: gsap.Context | undefined;
    inject(DestroyRef).onDestroy(() => contexto?.revert());

    afterNextRender(() => {
      contexto = animar(this.host, this.appAnimar(), this.retraso());
    });
  }
}
