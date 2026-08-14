import { Component, DestroyRef, ElementRef, computed, effect, inject, input, viewChild } from '@angular/core';
import { Chart, registerables, type ChartConfiguration } from 'chart.js';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import { ThemeService } from '../../../../full-pages/layout/services/theme.service';
import { colorCeldaHeatmap } from '../../utils/heatmap-color.util';
import type { DatosHeatmap } from '../../models/sistema/sistema.model';

Chart.register(...registerables, MatrixController, MatrixElement);

const ALTO_FILA_PX = 16;
const ALTO_MINIMO_PX = 420;
const ALTO_EXTRA_PX = 140;

/**
 * Heatmap semana×reporte — reemplaza `highcharts-chart` (tipo `heatmap`) del
 * legado por Chart.js + `chartjs-chart-matrix` (única combinación disponible
 * en el proyecto: Highcharts no está instalado). Color secuencial validado
 * con la skill `dataviz` (`heatmap-color.util.ts`), reactivo a
 * `ThemeService.oscuro`.
 */
@Component({
  selector: 'app-heatmap',
  standalone: true,
  imports: [],
  templateUrl: './heatmap.component.html',
  styleUrl: './heatmap.component.css',
})
export class HeatmapComponent {
  private readonly tema = inject(ThemeService);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private chart: Chart | null = null;

  readonly datos = input.required<DatosHeatmap>();

  protected readonly alturaPx = computed(() =>
    Math.max(ALTO_MINIMO_PX, this.datos().categoriasY.length * ALTO_FILA_PX + ALTO_EXTRA_PX)
  );

  constructor() {
    effect(() => {
      const datos = this.datos();
      const oscuro = this.tema.oscuro();
      this.renderizar(datos, oscuro);
    });

    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }

  private renderizar(datos: DatosHeatmap, oscuro: boolean): void {
    const canvas = this.canvasRef().nativeElement;
    const max = datos.puntos.reduce((m, p) => Math.max(m, p.v), 0);

    const puntos = datos.puntos.map((p) => ({
      x: datos.categoriasX[p.x],
      y: datos.categoriasY[p.y],
      v: p.v,
    }));

    const colorTexto = oscuro ? '#A3B2C9' : '#5A6A85';

    const config: ChartConfiguration<'matrix'> = {
      type: 'matrix',
      data: {
        datasets: [
          {
            label: datos.titulo,
            data: puntos,
            backgroundColor: (ctx) => {
              const raw = ctx.raw as { v: number } | undefined;
              return colorCeldaHeatmap(raw?.v ?? 0, max, oscuro);
            },
            borderWidth: 1,
            borderColor: oscuro ? '#0E1626' : '#FFFFFF',
            width: ({ chart }) => (chart.chartArea ?? { width: 0 }).width / datos.categoriasX.length - 1,
            height: ({ chart }) => (chart.chartArea ?? { height: 0 }).height / datos.categoriasY.length - 1,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'category',
            labels: datos.categoriasX,
            offset: true,
            position: 'top',
            ticks: { color: colorTexto, font: { size: 11 } },
            grid: { display: false },
            title: { display: true, text: 'Semana', color: colorTexto },
          },
          y: {
            type: 'category',
            labels: datos.categoriasY,
            offset: true,
            reverse: true,
            ticks: { color: colorTexto, font: { size: 10 } },
            grid: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: () => '',
              label: (ctx) => {
                const raw = ctx.raw as { x: string; y: string; v: number };
                return `${raw.v} visitas — ${raw.y} (semana ${raw.x})`;
              },
            },
          },
        },
      },
    };

    if (this.chart) {
      this.chart.destroy();
    }
    this.chart = new Chart(canvas, config);
  }
}
