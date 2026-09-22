import { Component, computed, input } from '@angular/core';

import type { MapaCalorCeroCuotas } from '../../../../utils/cero-cuotas-mapeo.util';

@Component({
  selector: 'app-mapa-calor-cero-cuotas',
  standalone: true,
  template: `
    <section class="rounded-xl border border-[var(--mis-border-subtle)] bg-[var(--mis-surface)] p-4">
      <h3 class="mb-4 text-base font-semibold text-[var(--mis-text-primary)]">{{ mapa().titulo }}</h3>

      <div class="overflow-x-auto">
        <div class="grid min-w-max gap-1 text-center text-xs" [style.grid-template-columns]="columnasGrid()">
          <span></span>
          @for (categoria of mapa().categoriasX; track categoria) {
            <span class="px-1 font-medium text-[var(--mis-text-secondary)]">{{ categoria }}</span>
          }

          @for (fila of filas(); track fila.etiqueta) {
            <span class="self-center pr-2 text-right font-medium text-[var(--mis-text-secondary)]">{{ fila.etiqueta }}</span>
            @for (valor of fila.valores; track $index) {
              <span
                class="flex min-h-10 items-center justify-center rounded px-1 font-medium"
                [style.background-color]="color(valor)"
                [style.color]="colorTexto(valor)"
                [attr.aria-label]="fila.etiqueta + ', ' + mapa().categoriasX[$index] + ': ' + formatear(valor) + ' millones'"
              >
                {{ formatear(valor) }}
              </span>
            }
          }
        </div>
      </div>

      <p class="mt-3 text-right text-xs text-[var(--mis-text-muted)]">Importe en millones</p>
    </section>
  `,
})
export class MapaCalorCeroCuotasComponent {
  readonly mapa = input.required<MapaCalorCeroCuotas>();

  protected readonly filas = computed(() => {
    const filas = this.mapa().categoriasY.map((etiqueta, indice) => ({
      etiqueta,
      valores: this.mapa().valores[indice] ?? [],
    }));

    return this.mapa().ejeYInvertido ? [...filas].reverse() : filas;
  });

  protected readonly columnasGrid = computed(
    () => `minmax(110px, auto) repeat(${this.mapa().categoriasX.length}, minmax(48px, 1fr))`,
  );

  private readonly maximo = computed(() => Math.max(0, ...this.mapa().valores.flat()));

  protected color(valor: number): string {
    const proporcion = this.maximo() > 0 ? valor / this.maximo() : 0;
    return `hsl(211 86% ${96 - proporcion * 53}%)`;
  }

  protected colorTexto(valor: number): string {
    const proporcion = this.maximo() > 0 ? valor / this.maximo() : 0;
    return proporcion >= 0.58 ? 'var(--mis-text-on-primary)' : 'var(--mis-text-primary)';
  }

  protected formatear(valor: number): string {
    return new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 }).format(valor);
  }
}
