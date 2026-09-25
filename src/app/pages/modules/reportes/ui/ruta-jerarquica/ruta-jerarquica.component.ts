import { Component, input, output } from '@angular/core';
import type { HierarquiaNodo } from '../../models/jerarquia.model';

/**
 * Migas de la jerarquía para los reportes con drill down (la tabla baja de nivel y el selector de
 * jerarquía queda oculto): la ruta con cada nivel anterior clicable, en todos los tamaños (salta de
 * línea si es larga). Sin botón "Volver": las migas ya son la forma de subir. Emite el índice del
 * nivel al que volver; el reporte decide cómo.
 */
@Component({
  selector: 'app-ruta-jerarquica',
  standalone: true,
  // `contents`: la ruta se acomoda en el flex del reporte, como cuando iba en línea.
  host: { class: 'contents' },
  template: `
    @if (ruta().length > 0) {
      <nav class="flex flex-wrap items-center gap-1.5 text-[12px]" [attr.aria-label]="etiqueta()">
        @for (nodo of ruta(); track nodo.cod_rel; let ultimo = $last; let i = $index) {
          @if (ultimo) {
            <span
              class="inline-flex items-center rounded-full border border-[var(--mis-primary)]/30 bg-[var(--mis-primary-light)] px-2.5 py-1 font-semibold text-[var(--mis-primary)] shadow-xs"
              aria-current="page"
            >
              <i class="pi pi-map-marker mr-1 text-[10px]" aria-hidden="true"></i>
              {{ nodo.des_rel ?? nodo.cod_rel }}
            </span>
          } @else {
            <button type="button" class="text-[var(--mis-primary)] hover:underline" (click)="irANivel.emit(i)">
              {{ nodo.des_rel ?? nodo.cod_rel }}
            </button>
            <i class="pi pi-angle-right text-[10px] text-[var(--mis-text-tertiary)]" aria-hidden="true"></i>
          }
        }
      </nav>

    }
  `,
})
export class RutaJerarquicaComponent {
  /** Ruta de la raíz al nivel actual; el último es el que se está viendo. */
  readonly ruta = input.required<readonly HierarquiaNodo[]>();
  /** `aria-label` de la navegación, p. ej. "Ruta de vinculación de cartera". */
  readonly etiqueta = input('Ruta de la jerarquía');
  /** Índice (en `ruta`) del nivel al que volver. */
  readonly irANivel = output<number>();
}
