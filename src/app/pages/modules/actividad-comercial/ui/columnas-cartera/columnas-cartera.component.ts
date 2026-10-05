import { Component, computed, input } from '@angular/core';
import { GraficoColumnasApiladasComponent } from '../../../../../shared/ui/graficos/grafico-columnas-apiladas/grafico-columnas-apiladas.component';
import { MAGENTA, NAVY } from '../../../../../shared/ui/graficos/utils/paleta-colores.util';
import type { ColumnasCartera } from '../../models/actividad-comercial.model';
import { datosColumnasCartera, formatearValor } from '../../utils/actividad-comercial.util';

/** Columnas de cartera (hoy apilado y cierre anterior): el dibujo es del gráfico compartido; acá solo se preparan los datos. */
@Component({
  selector: 'app-columnas-cartera',
  standalone: true,
  imports: [GraficoColumnasApiladasComponent],
  templateUrl: './columnas-cartera.component.html',
  styleUrl: './columnas-cartera.component.css',
})
export class ColumnasCarteraComponent {
  readonly datos = input.required<ColumnasCartera>();


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
