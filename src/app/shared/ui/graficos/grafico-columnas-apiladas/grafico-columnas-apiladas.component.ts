import { Component, computed, inject, input } from '@angular/core';
import type { Chart, Options, SVGElement } from 'highcharts';
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
    const { categorias, series, meta, faltan, totales } = this.datos();
    const oscuro = this.tema.oscuro();
    const base = opcionesBase(oscuro, true);
    const { texto, textoFuerte, linea } = tokensTema(oscuro);
    let marcaFaltan: SVGElement | undefined;

    return {
      ...base,
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
        style: { fontFamily: 'inherit' },
        spacing: [18, 4, 4, 4],
        events: {
          // Lo que falta: hueco punteado de `desde` (total Hoy, sin Heredada) a la meta sobre la primera columna.
          render(this: Chart) {
            marcaFaltan?.destroy();
            marcaFaltan = undefined;
            const barra = this.series[0]?.points[0]?.shapeArgs;
            if (!faltan || !meta || !barra) return;
            const arriba = this.yAxis[0].toPixels(meta.valor, false);
            const abajo = this.yAxis[0].toPixels(faltan.desde, false);
            const x = this.plotLeft + (barra['x'] ?? 0);
            const ancho = barra['width'] ?? 0;
            const grupo = this.renderer.g('faltan').attr({ zIndex: 5 }).add();
            this.renderer
              .rect(x, arriba, ancho, abajo - arriba)
              .attr({ fill: 'none', stroke: AZUL, 'stroke-width': 1, 'stroke-dasharray': '3,3' })
              .add(grupo);
            this.renderer
              .text(faltan.etiqueta, x + ancho + 4, arriba + 11)
              .css({ color: AZUL, fontSize: '9px', fontWeight: '700' })
              .add(grupo);
            marcaFaltan = grupo;
          },
        },
      },
      xAxis: {
        categories: [...categorias],
        lineColor: linea,
        tickLength: 0,
        labels: {
          rotation: 0,
          // Total de la columna sobre el nombre de su categoría.
          formatter() {
            const total = totales?.[this.pos];
            return total ? `<b>${total}</b><br/>${this.value}` : String(this.value);
          },
          style: { color: textoFuerte, fontSize: '11px', fontWeight: '500', textOverflow: 'none' },
        },
      },
      yAxis: {
        min: 0,
        // El tope del eje es la meta (o la barra más alta si no hay meta o la supera), sin holgura.
        ...(meta ? { softMax: meta.valor } : {}),
        maxPadding: 0,
        endOnTick: false,
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
          pointWidth: 26,
          // Barras corridas a la izquierda de su categoría: a la derecha queda el sitio de la cifra de cada tramo.
          pointPlacement: -0.25,
          dataLabels: {
            enabled: true,
            // Cifra del tramo a un costado de la barra; un tramo casi nulo no lleva cifra (queda en el tooltip).
            align: 'left',
            verticalAlign: 'middle',
            x: 20,
            overflow: 'allow',
            crop: false,
            allowOverlap: true,
            formatter() {
              return this.y === null || this.y === undefined || (this.percentage ?? 100) < 3 ? '' : this.y.toLocaleString('en-US');
            },
            style: { color: textoFuerte, fontSize: '9px', fontWeight: '600', textOutline: 'none' },
          },
        },
      },
      series: [
        ...series.map((s) => ({
          type: 'column' as const,
          name: s.nombre,
          data: [...s.valores],
          color: s.color,
        })),
      ],
    };
  });
}
