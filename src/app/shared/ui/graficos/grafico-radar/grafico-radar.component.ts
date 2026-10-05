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
    const { textoFuerte, linea } = tokensTema(oscuro);
    // Texto del radar: negro en claro (el gris no se leía), el tono fuerte del tema en oscuro.
    const texto = oscuro ? textoFuerte : '#000000';

    return {
      ...opcionesBase(oscuro, true),
      chart: { polar: true, type: 'area', backgroundColor: 'transparent', style: { fontFamily: 'inherit' } },
      pane: { size: '80%' },
      xAxis: {
        categories: [...ejes],
        tickmarkPlacement: 'on',
        lineWidth: 0,
        labels: {
          // Nombre del eje y, debajo, el valor de cada serie ("85/70": asesor/promedio).
          formatter() {
            const valores = series.map((s) => s.valores[this.pos]).join('/');
            return `<span style="font-weight:600">${this.value}</span><br/><span style="font-size:10px;font-weight:400;color:${texto}">${valores}</span>`;
          },
          style: { color: texto, fontSize: '11px', textOverflow: 'none', whiteSpace: 'nowrap' },
        },
      },
      yAxis: {
        min: 0,
        max: maximo,
        tickInterval: maximo / 4,
        gridLineInterpolation: 'polygon',
        gridLineColor: linea,
        lineWidth: 0,
        labels: { style: { color: texto, fontSize: '10px' } },
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
        marker: { enabled: !s.discontinua },        pointPlacement: 'on' as const,
      })),
    };
  });
}
