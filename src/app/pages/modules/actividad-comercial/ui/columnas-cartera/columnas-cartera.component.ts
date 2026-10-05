import { Component, computed, input } from '@angular/core';
import { GraficoColumnasApiladasComponent } from '../../../../../shared/ui/graficos/grafico-columnas-apiladas/grafico-columnas-apiladas.component';
import { AZUL, MAGENTA, NAVY } from '../../../../../shared/ui/graficos/utils/paleta-colores.util';
import type { ColumnasCartera } from '../../models/actividad-comercial.model';
import { datosColumnasCartera, faltanteMeta, formatearValor } from '../../utils/actividad-comercial.util';

/** Columnas de cartera (hoy apilado y cierre anterior): el dibujo es del gráfico compartido; acá solo se preparan los datos. */
@Component({
  selector: 'app-columnas-cartera',
  standalone: true,
  imports: [GraficoColumnasApiladasComponent],
  template: `
    <figure class="m-0 flex min-w-0 flex-col" [attr.aria-label]="resumenAccesible()">
      <figcaption class="flex items-baseline justify-between gap-2 text-xs leading-4 text-[var(--mis-text-secondary)]">
        <span>{{ datos().titulo }}</span>
        @if (faltante() !== null) {
          <span class="text-[10px]" [style.color]="colorMeta">Faltan <b>{{ texto(faltante()!) }}</b></span>
        }
      </figcaption>
      <div class="h-[210px] min-h-0">
        <app-grafico-columnas-apiladas [datos]="grafico()" />
      </div>
    </figure>
  `,
  styles: [':host { display: block; min-width: 0; }'],
})
export class ColumnasCarteraComponent {
  readonly datos = input.required<ColumnasCartera>();

  protected readonly colorMeta = AZUL;
  protected readonly faltante = computed(() => faltanteMeta(this.datos()));

  protected readonly grafico = computed(() =>
    datosColumnasCartera(this.datos(), this.datos().paleta === 'saldo' ? NAVY : MAGENTA),
  );

  protected readonly resumenAccesible = computed(() => {
    const d = this.datos();
    const tramos = d.hoy.map((s) => `${s.etiqueta} ${this.texto(s.valor)}`).join(', ');
    return `${d.titulo}. Hoy: ${this.texto(d.totalHoy)} (${tramos}). Cierre anterior: ${this.texto(d.cierreAnterior)}.`;
  });

  protected texto(valor: number): string {
    return formatearValor(valor, this.datos().formato);
  }
}
