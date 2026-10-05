import { Component, computed, inject, input } from '@angular/core';
import type { Options } from 'highcharts';
import { ThemeService } from '../../../services/theme.service';
import type { DatosColumnasApiladas } from '../models/grafico-comun.model';
import { GraficoBaseComponent } from '../grafico-base/grafico-base.component';
import { opcionesBase } from '../utils/highcharts-factory.util';
import { AZUL, tokensTema } from '../utils/paleta-colores.util';

/** Luminancia aproximada de un `#RRGGBB`: decide texto blanco u oscuro encima. */
function esOscuro(hex: string): boolean {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return 0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255) < 150;
}

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
    // Dentro de una barra delgada solo caben cifras cortas (1.1M, 976K); el tooltip trae el valor exacto.
    const compacto = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

    return {
      ...base,
      chart: { type: 'column', backgroundColor: 'transparent', style: { fontFamily: 'inherit' }, spacing: [10, 4, 4, 4] },
      xAxis: {
        categories: [...categorias],
        lineColor: linea,
        tickLength: 0,
        labels: { rotation: 0, style: { color: textoFuerte, fontSize: '11px', fontWeight: '600', textOverflow: 'none' } },
      },
      yAxis: {
        min: 0,
        // La escala llega justo a la barra más alta; la meta solo se dibuja si cae dentro de ese rango.
        maxPadding: 0.02,
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
        itemStyle: { color: texto, fontSize: '9px', fontWeight: '500', whiteSpace: 'nowrap' },
        itemDistance: 6,
        padding: 0,
        symbolPadding: 2,
        symbolHeight: 7,
        symbolWidth: 7,
        symbolRadius: 2,
      },
      tooltip: { ...base.tooltip, shared: true },
      plotOptions: {
        column: {
          stacking: 'normal',
          borderWidth: 0,
          pointPadding: 0.3,
          groupPadding: 0.2,
          dataLabels: {
            enabled: true,
            // Un tramo muy fino no cabe con su cifra: se omite (queda en el tooltip).
            formatter() {
              return this.y === null || this.y === undefined || (this.percentage ?? 100) < 8 ? '' : compacto.format(this.y);
            },
            style: { fontSize: '10px', fontWeight: '600', textOutline: 'none' },
          },
        },
      },
      series: series.map((s) => ({
        type: 'column' as const,
        name: s.nombre,
        data: [...s.valores],
        color: s.color,
        dataLabels: { color: esOscuro(s.color) ? '#FFFFFF' : '#1B2A41' },
      })),
    };
  });
}
