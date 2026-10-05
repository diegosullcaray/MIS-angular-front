import { Component, computed, input } from '@angular/core';
import { ProgressBarModule } from 'primeng/progressbar';

/**
 * Barra de avance frente a una meta (el extremo derecho es la meta). La barra es `p-progressbar`;
 * lo único propio son las superposiciones que PrimeNG no trae: una marca en una posición (p. ej. la meta
 * de efectividad), un triángulo de avance esperado y la etiqueta sobre el relleno.
 */
@Component({
  selector: 'app-barra-meta',
  standalone: true,
  imports: [ProgressBarModule],
  template: `
    <div class="relative" [class.mt-[18px]]="etiquetaFlotante()">
      <p-progressbar
        [value]="pct()"
        [showValue]="false"
        [color]="color()"
        [attr.aria-label]="descripcion()"
        [style.--p-progressbar-height.px]="alto()"
        style="--p-progressbar-background: var(--mis-panel-bg)"
      />
      @if (etiquetaFlotante()) {
        <span
          class="absolute -top-[18px] -translate-x-1/2 whitespace-nowrap text-[11px] font-bold"
          [style.left.%]="pct()"
          [style.color]="colorTexto()"
          >{{ etiquetaFlotante() }}</span
        >
      }
      @if (marca() !== null) {
        <span
          aria-hidden="true"
          class="absolute -top-[3px] z-[2] w-0.5 -translate-x-1/2 bg-[var(--mis-text-primary)]"
          [style.left.%]="marca()"
          [style.height.px]="alto() + 6"
        ></span>
      }
      @if (esperado() !== null) {
        <span
          aria-hidden="true"
          class="absolute top-0 z-[2] w-0.5 -translate-x-1/2 bg-[var(--mis-primary)]"
          [style.left.%]="esperado()"
          [style.height.px]="alto() + 3"
        ></span>
        <svg
          aria-hidden="true"
          class="absolute -top-[7px] z-[3] -translate-x-1/2"
          width="9"
          height="10"
          viewBox="0 0 10 10"
          [style.left.%]="esperado()"
          style="fill: var(--mis-primary)"
        >
          <polygon points="0,0 10,0 5,8" />
        </svg>
      }
    </div>
  `,
  styles: [':host { display: block; width: 100%; }'],
})
export class BarraMetaComponent {
  /** Avance 0–100. */
  readonly pct = input.required<number>();
  readonly color = input('var(--mis-primary)');
  /** Marca (tick oscuro) en esta posición 0–100. */
  readonly marca = input<number | null>(null);
  /** Avance esperado 0–100 (triángulo + tick). */
  readonly esperado = input<number | null>(null);
  /** Texto sobre la barra, al final del relleno. */
  readonly etiquetaFlotante = input('');
  readonly alto = input(10);
  /** Lectura para tecnologías de apoyo. */
  readonly descripcion = input('Avance');

  /** Texto legible en ambos temas: el color de la barra mezclado con el texto primario. */
  protected readonly colorTexto = computed(() => `color-mix(in srgb, ${this.color()} 55%, var(--mis-text-primary))`);
}
