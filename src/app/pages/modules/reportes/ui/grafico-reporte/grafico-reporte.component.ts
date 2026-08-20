import { Component, DestroyRef, ElementRef, effect, inject, input, viewChild } from '@angular/core';
import { Chart, registerables, type ChartConfiguration } from 'chart.js';
import { ThemeService } from '../../../../full-pages/layout/services/theme.service';
import type { BloqueGrafico } from '../../models/grafico-reporte.model';

Chart.register(...registerables);

/** Mismos colores que el legado `theme_gp1()` (`theme.module.ts`): primera serie, segunda serie, y refuerzos si hay más. */
const PALETA = ['#0191CE', '#164D90', '#2E9E5B', '#D97706', '#DC2626'];

/** Gráfico de línea de un bloque del motor de reportes "mixtos" (`graphicData`) — reemplaza `app-graphic-basic`/Highcharts del legado. */
@Component({
  selector: 'app-grafico-reporte',
  standalone: true,
  imports: [],
  templateUrl: './grafico-reporte.component.html',
  styleUrl: './grafico-reporte.component.css',
})
export class GraficoReporteComponent {
  private readonly tema = inject(ThemeService);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('lienzo');
  private chart: Chart | null = null;

  readonly datos = input.required<BloqueGrafico>();

  constructor() {
    effect(() => {
      const datos = this.datos();
      const oscuro = this.tema.oscuro();
      this.renderizar(datos, oscuro);
    });

    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }

  private renderizar(datos: BloqueGrafico, oscuro: boolean): void {
    const canvas = this.canvasRef().nativeElement;
    const colorTexto = oscuro ? '#A3B2C9' : '#5A6A85';
    const colorGrilla = oscuro ? 'rgba(163,178,201,0.12)' : 'rgba(90,106,133,0.12)';

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: datos.categorias,
        datasets: datos.series.map((serie, i) => {
          const color = serie.color ?? PALETA[i % PALETA.length];
          return {
            label: serie.nombre,
            data: serie.datos,
            borderColor: color,
            backgroundColor: color,
            tension: 0.3,
            pointRadius: 3,
            spanGaps: true,
          };
        }),
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: colorTexto, font: { size: 11 } }, grid: { display: false } },
          y: {
            ticks: { color: colorTexto, font: { size: 11 } },
            grid: { color: colorGrilla },
            title: { display: !!datos.tituloEjeY, text: datos.tituloEjeY ?? '', color: colorTexto },
          },
        },
        plugins: {
          legend: { display: datos.series.length > 1, labels: { color: colorTexto } },
          tooltip: { mode: 'index', intersect: false },
        },
      },
    };

    this.chart?.destroy();
    this.chart = new Chart(canvas, config);
  }
}
