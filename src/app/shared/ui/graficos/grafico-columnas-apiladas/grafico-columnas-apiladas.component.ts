import { Component, computed, inject, input } from '@angular/core';
import Highcharts from 'highcharts/esm/highcharts.js';
import type { Options } from 'highcharts';
import { ThemeService } from '../../../services/theme.service';
import type { DatosColumnasApiladas } from '../models/grafico-comun.model';
import { GraficoBaseComponent } from '../grafico-base/grafico-base.component';
import { opcionesBase } from '../utils/highcharts-factory.util';
import { AZUL, tokensTema } from '../utils/paleta-colores.util';

/** Columnas apiladas (una por categoría) con etiqueta por tramo, leyenda abajo y meta opcional. */
@Component({
  selector: 'app-grafico-columnas-apiladas',
  standalone: true,
  imports: [GraficoBaseComponent],
  template: '<app-grafico-base [opciones]="opciones()" />',
  styles: [':host { display: flex; height: 100%; min-height: 0; } app-grafico-base { flex: 1; min-height: 0; }'],
})
export class GraficoColumnasApiladasComponent {
  private readonly tema = inject(ThemeService);

  readonly datos = input.required<DatosColumnasApiladas>();

  protected readonly opciones = computed<Options>(() => {
    const { categorias, series, meta } = this.datos();
    const oscuro = this.tema.oscuro();
    const base = opcionesBase(oscuro, true);
    const { texto, textoFuerte, linea } = tokensTema(oscuro);
    const miles = (valor: number) => Highcharts.numberFormat(valor, 0, '.', ',');

    return {
      ...base,
      chart: { type: 'column', backgroundColor: 'transparent', style: { fontFamily: 'inherit' }, spacing: [18, 4, 4, 4] },
      xAxis: {
        categories: [...categorias],
        lineColor: linea,
        tickLength: 0,
        labels: { rotation: 0, style: { color: textoFuerte, fontSize: '11px', fontWeight: '600', textOverflow: 'none' } },
      },
      yAxis: {
        min: 0,
        // La escala llega a la meta para que la línea quede dentro del gráfico.
        ...(meta ? { softMax: meta.valor } : {}),
        title: { text: undefined },
        labels: { enabled: false },
        gridLineColor: linea,
        reversedStacks: false,
        plotLines: meta
          ? [
              {
                value: meta.valor,
                color: AZUL,
                dashStyle: 'Dash',
                width: 1,
                zIndex: 5,
                label: { text: meta.etiqueta, align: 'right', y: -4, style: { color: AZUL, fontSize: '10px', fontWeight: '600' } },
              },
            ]
          : [],
      },
      legend: {
        ...base.legend,
        itemStyle: { color: texto, fontSize: '10px', fontWeight: '500' },
        symbolHeight: 8,
        symbolWidth: 8,
        symbolRadius: 2,
      },
      tooltip: { ...base.tooltip, shared: true },
      plotOptions: {
        column: {
          stacking: 'normal',
          borderWidth: 0,
          pointPadding: 0.12,
          groupPadding: 0.12,
          dataLabels: {
            enabled: true,
            formatter() {
              return this.y === null || this.y === undefined ? '' : miles(this.y);
            },
            style: { color: textoFuerte, fontSize: '10px', fontWeight: '500', textOutline: 'none' },
          },
        },
      },
      series: series.map((s) => ({ type: 'column' as const, name: s.nombre, data: [...s.valores], color: s.color })),
    };
  });
}
