import { Component, input } from '@angular/core';

/** Alturas relativas (%) de las barras del esqueleto: una silueta de columnas, fija para no parpadear. */
const BARRAS = [55, 80, 40, 95, 65, 30, 75, 50] as const;

/**
 * Esqueleto de carga de un gráfico: título, leyenda y columnas en pulso, del mismo tamaño que la
 * tarjeta del gráfico que reemplaza (ocupa todo el alto disponible). Se usa en vez de un texto
 * "Cargando gráficos…" mientras el gráfico no respondió; nunca junto con el overlay global.
 *
 * ```html
 * @if (cargando()) { <app-esqueleto-grafico /> } @else { <app-grafico-mixto … /> }
 * ```
 */
@Component({
  selector: 'app-esqueleto-grafico',
  standalone: true,
  template: `
    <div class="flex flex-col gap-3 h-full w-full" role="status" aria-busy="true" [attr.aria-label]="etiqueta()">
      <div class="h-3.5 w-2/5 rounded bg-[var(--mis-border-strong)] animate-pulse"></div>
      <div class="flex gap-3">
        <div class="h-2.5 w-16 rounded bg-[var(--mis-border)] animate-pulse"></div>
        <div class="h-2.5 w-16 rounded bg-[var(--mis-border)] animate-pulse"></div>
      </div>
      <div class="flex-1 min-h-[160px] flex items-end gap-[4%] px-2 pb-2 border-b border-l border-[var(--mis-border)]">
        @for (alto of barras; track $index) {
          <div class="flex-1 rounded-t bg-[var(--mis-border-strong)] animate-pulse" [style.height.%]="alto"></div>
        }
      </div>
    </div>
  `,
  styles: [':host { display: flex; flex-direction: column; height: 100%; min-height: 0; flex: 1 1 auto; }'],
})
export class EsqueletoGraficoComponent {
  /** Texto para lectores de pantalla. */
  readonly etiqueta = input('Cargando gráfico');
  protected readonly barras = BARRAS;
}
