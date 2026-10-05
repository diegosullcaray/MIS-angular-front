import { Component, computed, inject, input } from '@angular/core';
import Highcharts from 'highcharts/esm/highcharts.js';
import HighchartsMore from 'highcharts/esm/highcharts-more.js';
import type { Options } from 'highcharts';
import { ThemeService } from '../../../services/theme.service';
import type { DatosRadar } from '../models/grafico-comun.model';
import { GraficoBaseComponent } from '../grafico-base/grafico-base.component';
import { opcionesBase } from '../utils/highcharts-factory.util';
import { tokensTema } from '../utils/paleta-colores.util';

// En Highcharts 13 el módulo se auto-registra al importarse (ver grafico-mapa-calor).
void HighchartsMore;
void Highcharts;

/** Radar (polar) con varias series sobre los mismos ejes; la leyenda va abajo. */
@Component({
  selector: 'app-grafico-radar',
  standalone: true,
  imports: [GraficoBaseComponent],
  template: '<app-grafico-base [opciones]="opciones()" />',
  styles: [':host { display: flex; height: 100%; min-height: 0; } app-grafico-base { flex: 1; min-height: 0; }'],
})
export class GraficoRadarComponent {
  private readonly tema = inject(ThemeService);

  readonly datos = input.required<DatosRadar>();

  protected readonly opciones = computed<Options>(() => {
    const { ejes, series, maximo = 100 } = this.datos();
    const oscuro = this.tema.oscuro();
    const { texto, textoFuerte, linea } = tokensTema(oscuro);

    return {
      ...opcionesBase(oscuro, true),
      chart: { polar: true, type: 'area', backgroundColor: 'transparent', style: { fontFamily: 'inherit' }, margin: [26, 52, 42, 52] },
      pane: { size: '100%' },
      xAxis: {
        categories: [...ejes],
        tickmarkPlacement: 'on',
        lineWidth: 0,
        labels: { style: { color: textoFuerte, fontSize: '11px', fontWeight: '600', textOverflow: 'none', whiteSpace: 'nowrap' } },
      },
      yAxis: {
        min: 0,
        max: maximo,
        tickInterval: maximo / 4,
        gridLineInterpolation: 'polygon',
        gridLineColor: linea,
        lineWidth: 0,
        labels: { style: { color: texto, fontSize: '8px' } },
      },
      tooltip: { ...opcionesBase(oscuro).tooltip, shared: true, valueSuffix: '' },
      legend: { ...opcionesBase(oscuro).legend, verticalAlign: 'bottom', itemStyle: { color: texto, fontSize: '11px', fontWeight: '500' } },
      plotOptions: { series: { marker: { radius: 3, lineColor: '#FFFFFF', lineWidth: 1.5 } }, area: { fillOpacity: 0.14 } },
      series: series.map((s) => ({
        type: 'area' as const,
        name: s.nombre,
        data: [...s.valores],
        color: s.color,
        lineWidth: 2,
        dashStyle: s.discontinua ? ('Dash' as const) : ('Solid' as const),
        fillOpacity: s.discontinua ? 0.06 : 0.16,
        marker: { enabled: !s.discontinua },
        pointPlacement: 'on' as const,
      })),
    };
  });
}
