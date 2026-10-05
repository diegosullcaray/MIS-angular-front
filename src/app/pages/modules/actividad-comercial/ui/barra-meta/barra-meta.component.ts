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
  templateUrl: './barra-meta.component.html',
  styleUrl: './barra-meta.component.css',
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
