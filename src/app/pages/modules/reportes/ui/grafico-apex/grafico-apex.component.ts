import {
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  input,
  output,
  viewChild,
  AfterViewInit,
} from '@angular/core';
import ApexCharts from 'apexcharts';
import type { ApexOptions } from 'apexcharts';
import { ThemeService } from '../../../../full-pages/layout/services/theme.service';
import type { BloqueGrafico } from '../../models/grafico-reporte.model';

/** Paleta por defecto para el modo claro y oscuro. */
const PALETA_CLARA = ['#0191CE', '#164D90', '#2E9E5B', '#D97706', '#DC2626'];
const PALETA_OSCURA = ['#38BDF8', '#818CF8', '#34D399', '#FCD34D', '#F87171'];

/**
 * Infiere el tipo de gráfica según las series del bloque:
 * - 2 series donde una contiene "%" → gráfica mixta (barra + línea)
 * - 1 sola serie → barra horizontal con gradiente
 * - 3+ series (resumen general) → columnas agrupadas + línea overlay
 */
function inferirTipo(bloque: BloqueGrafico): 'mixed-bar-line' | 'bar-h' | 'column-line' {
  const n = bloque.series.length;
  if (n === 1) return 'bar-h';
  if (n === 2 && bloque.series.some((s) => s.nombre.includes('%'))) return 'mixed-bar-line';
  return 'column-line';
}

/**
 * Gráfica ApexCharts avanzada para los bloques del módulo Agro-Mix.
 *
 * Reemplaza `app-grafico-reporte` (Chart.js) en la vista de detalle de cultivos.
 * Soporta modos claro/oscuro, animaciones spring, gráficas mixtas y clic en barra.
 */
@Component({
  selector: 'app-grafico-apex',
  standalone: true,
  imports: [],
  template: `
    <div class="flex flex-col h-full">
      <h3 class="text-[13px] font-semibold text-[var(--mis-text-secondary)] mb-2 uppercase tracking-wide leading-tight">
        {{ datos().titulo }}
      </h3>
      <div #chartEl class="flex-1 min-h-[280px]"></div>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
    :host ::ng-deep .apexcharts-tooltip {
      border-radius: 10px !important;
      border: 1px solid var(--mis-border) !important;
      box-shadow: 0 8px 24px rgba(0,0,0,.12) !important;
      font-family: inherit !important;
      background: var(--mis-background) !important;
    }
    :host ::ng-deep .apexcharts-tooltip-title {
      background: var(--mis-surface-hover) !important;
      border-bottom: 1px solid var(--mis-border) !important;
      font-weight: 600 !important;
      padding: 8px 12px !important;
    }
    :host ::ng-deep .apexcharts-tooltip-series-group { padding: 6px 12px !important; }
    :host ::ng-deep .apexcharts-xaxistooltip,
    :host ::ng-deep .apexcharts-yaxistooltip {
      background: var(--mis-background) !important;
      border-color: var(--mis-border) !important;
    }
  `],
})
export class GraficoApexComponent implements AfterViewInit {
  private readonly tema = inject(ThemeService);
  private readonly chartEl = viewChild.required<ElementRef<HTMLDivElement>>('chartEl');
  private chart: ApexCharts | null = null;

  readonly datos = input.required<BloqueGrafico>();
  /** Emite el label de la categoría clickeada (para abrir el modal del mapa). */
  readonly puntoSeleccionado = output<string>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());

    effect(() => {
      const bloque = this.datos();
      const oscuro = this.tema.oscuro();
      if (this.chart) {
        this.chart.destroy();
      }
      // Pequeño timeout para que el DOM esté listo tras un cambio de datos
      setTimeout(() => this.renderizar(bloque, oscuro), 0);
    });
  }

  ngAfterViewInit(): void {
    this.renderizar(this.datos(), this.tema.oscuro());
  }

  private renderizar(bloque: BloqueGrafico, oscuro: boolean): void {
    const el = this.chartEl().nativeElement;
    if (!el || bloque.categorias.length === 0) return;

    this.chart?.destroy();
    const tipo = inferirTipo(bloque);
    const opts = tipo === 'bar-h'
      ? this.buildBarH(bloque, oscuro)
      : tipo === 'mixed-bar-line'
        ? this.buildMixedBarLine(bloque, oscuro)
        : this.buildColumnLine(bloque, oscuro);

    this.chart = new ApexCharts(el, opts);
    this.chart.render();
  }

  // ─── Gráfica de barras horizontales con gradiente (1 serie) ──────────────────
  private buildBarH(bloque: BloqueGrafico, oscuro: boolean): ApexOptions {
    const paleta = oscuro ? PALETA_OSCURA : PALETA_CLARA;
    const text = oscuro ? '#94A3B8' : '#64748B';
    const grid = oscuro ? '#1E293B' : '#F1F5F9';
    const serie = bloque.series[0];

    return {
      chart: {
        type: 'bar',
        height: '100%',
        toolbar: { show: false },
        animations: {
          enabled: true,
          easing: 'spring',
          speed: 700,
          animateGradually: { enabled: true, delay: 60 },
        },
        events: {
          dataPointSelection: (_e: MouseEvent, _chart: unknown, cfg: any) => {
            const label = bloque.categorias[cfg?.dataPointIndex ?? -1];
            if (label) this.puntoSeleccionado.emit(label);
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          borderRadiusApplication: 'end',
          dataLabels: { position: 'bottom' },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: oscuro ? 'dark' : 'light',
          type: 'horizontal',
          gradientToColors: [oscuro ? '#818CF8' : '#164D90'],
          stops: [0, 100],
        },
      },
      colors: [paleta[0]],
      series: [{ name: serie.nombre, data: serie.datos as number[] }],
      xaxis: {
        categories: bloque.categorias,
        labels: { style: { colors: text, fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: text, fontSize: '11px' }, maxWidth: 140 } },
      grid: { borderColor: grid, strokeDashArray: 3 },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => val ? val.toLocaleString('es-PE', { maximumFractionDigits: 0 }) : '',
        style: { fontSize: '11px', colors: [oscuro ? '#CBD5E1' : '#334155'] },
        background: { enabled: false },
      },
      tooltip: {
        theme: oscuro ? 'dark' : 'light',
        y: { formatter: (val: number) => val?.toLocaleString('es-PE', { maximumFractionDigits: 0 }) ?? '' },
      },
      states: {
        hover: { filter: { type: 'lighten', value: 0.05 } },
        active: { filter: { type: 'darken', value: 0.1 } },
      },
    };
  }

  // ─── Gráfica mixta: barra principal + línea de porcentaje (2 series) ─────────
  private buildMixedBarLine(bloque: BloqueGrafico, oscuro: boolean): ApexOptions {
    const paleta = oscuro ? PALETA_OSCURA : PALETA_CLARA;
    const text = oscuro ? '#94A3B8' : '#64748B';
    const grid = oscuro ? '#1E293B' : '#F1F5F9';

    // La serie con "%" va al eje Y secundario como línea
    const serieBar = bloque.series.find((s) => !s.nombre.includes('%')) ?? bloque.series[0];
    const serieLine = bloque.series.find((s) => s.nombre.includes('%')) ?? bloque.series[1];

    return {
      chart: {
        type: 'bar',
        height: '100%',
        toolbar: { show: false },
        animations: {
          enabled: true,
          easing: 'spring',
          speed: 700,
          animateGradually: { enabled: true, delay: 50 },
        },
        events: {
          dataPointSelection: (_e: MouseEvent, _chart: unknown, cfg: any) => {
            const label = bloque.categorias[cfg?.dataPointIndex ?? -1];
            if (label) this.puntoSeleccionado.emit(label);
          },
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 5,
          borderRadiusApplication: 'end',
        },
      },
      colors: [paleta[0], oscuro ? '#FCD34D' : '#D97706'],
      series: [
        { name: serieBar.nombre, type: 'bar', data: serieBar.datos as number[] },
        { name: serieLine.nombre, type: 'line', data: serieLine.datos as number[] },
      ],
      stroke: { width: [0, 3], curve: 'smooth' },
      markers: { size: [0, 5], hover: { size: 7 } },
      fill: {
        type: ['gradient', 'solid'],
        gradient: {
          shade: oscuro ? 'dark' : 'light',
          type: 'horizontal',
          gradientToColors: [oscuro ? '#818CF8' : '#164D90'],
          stops: [0, 100],
          opacityFrom: 0.9,
          opacityTo: 0.7,
        },
      },
      xaxis: {
        categories: bloque.categorias,
        labels: { style: { colors: text, fontSize: '11px' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: [
        {
          seriesName: serieBar.nombre,
          labels: { style: { colors: text, fontSize: '11px' }, maxWidth: 140 },
          axisBorder: { show: false },
        },
        {
          seriesName: serieLine.nombre,
          opposite: true,
          labels: {
            style: { colors: oscuro ? '#FCD34D' : '#D97706', fontSize: '11px' },
            formatter: (val: number) => `${val?.toFixed(1)}%`,
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
        },
      ],
      grid: { borderColor: grid, strokeDashArray: 3 },
      dataLabels: { enabled: false },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        labels: { colors: text },
        markers: { size: 8 },
      },
      tooltip: {
        theme: oscuro ? 'dark' : 'light',
        shared: true,
        intersect: false,
        y: [
          { formatter: (val: number) => val?.toLocaleString('es-PE', { maximumFractionDigits: 0 }) ?? '' },
          { formatter: (val: number) => `${val?.toFixed(2)}%` },
        ],
      },
    };
  }

  // ─── Gráfica columnas + línea overlay (resumen general, 3+ series) ───────────
  private buildColumnLine(bloque: BloqueGrafico, oscuro: boolean): ApexOptions {
    const paleta = oscuro ? PALETA_OSCURA : PALETA_CLARA;
    const text = oscuro ? '#94A3B8' : '#64748B';
    const grid = oscuro ? '#1E293B' : '#F1F5F9';

    const seriesConfig = bloque.series.map((s, i) => ({
      name: s.nombre,
      type: s.nombre.includes('%') ? 'line' : 'column',
      data: s.datos as number[],
    }));

    const colors = bloque.series.map((s, i) =>
      s.nombre.includes('%') ? (oscuro ? '#FCD34D' : '#D97706') : paleta[i % paleta.length]
    );

    return {
      chart: {
        type: 'line',
        height: '100%',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 600,
          animateGradually: { enabled: true, delay: 80 },
        },
        events: {
          dataPointSelection: (_e: MouseEvent, _chart: unknown, cfg: any) => {
            const label = bloque.categorias[cfg?.dataPointIndex ?? -1];
            if (label) this.puntoSeleccionado.emit(label);
          },
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 5,
          columnWidth: '55%',
          borderRadiusApplication: 'end',
        },
      },
      colors,
      series: seriesConfig,
      stroke: {
        width: bloque.series.map((s) => (s.nombre.includes('%') ? 3 : 0)),
        curve: 'smooth',
      },
      markers: {
        size: bloque.series.map((s) => (s.nombre.includes('%') ? 5 : 0)),
        hover: { size: 7 },
      },
      fill: {
        type: bloque.series.map((s) => (s.nombre.includes('%') ? 'solid' : 'gradient')),
        gradient: {
          shade: oscuro ? 'dark' : 'light',
          type: 'vertical',
          opacityFrom: 0.9,
          opacityTo: 0.5,
          stops: [0, 100],
        },
      },
      xaxis: {
        categories: bloque.categorias,
        labels: {
          style: { colors: text, fontSize: '11px' },
          rotate: -30,
          rotateAlways: false,
          hideOverlappingLabels: true,
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: [
        {
          labels: {
            style: { colors: text, fontSize: '11px' },
            formatter: (val: number) => {
              if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
              if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
              return val?.toFixed(0) ?? '';
            },
          },
          axisBorder: { show: false },
        },
        ...(bloque.series.some((s) => s.nombre.includes('%'))
          ? [{
              opposite: true,
              labels: {
                style: { colors: oscuro ? '#FCD34D' : '#D97706', fontSize: '11px' },
                formatter: (val: number) => `${val?.toFixed(1)}%`,
              },
              axisBorder: { show: false },
              axisTicks: { show: false },
            }]
          : []),
      ],
      grid: { borderColor: grid, strokeDashArray: 3 },
      dataLabels: { enabled: false },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        labels: { colors: text },
        markers: { size: 8 },
      },
      tooltip: {
        theme: oscuro ? 'dark' : 'light',
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number, opts?: { seriesIndex?: number }) => {
            const s = bloque.series[opts?.seriesIndex ?? 0];
            if (s?.nombre.includes('%')) return `${val?.toFixed(2)}%`;
            return `S/ ${val?.toLocaleString('es-PE', { maximumFractionDigits: 0 }) ?? ''}`;
          },
        },
      },
    };
  }
}
