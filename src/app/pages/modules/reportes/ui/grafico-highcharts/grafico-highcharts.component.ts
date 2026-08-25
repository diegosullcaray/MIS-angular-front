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
// El build ESM de Highcharts 13 solo expone `default` en runtime, pero sus
// tipos son exports con nombre — de ahí la importación partida en dos.
import Highcharts from 'highcharts';
import type {
  AxisLabelsFormatterContextObject,
  Chart,
  Options,
  Point,
  PointClickEventObject,
  SeriesOptionsType,
  TooltipFormatterCallbackFunction,
} from 'highcharts';
import { ThemeService } from '../../../../full-pages/layout/services/theme.service';
import type { BloqueGrafico, SerieGrafico } from '../../models/grafico-reporte.model';

/**
 * Paleta del legado (`agro-mix-d.component.ts`) — son los colores exactos que
 * el reporte usa hoy en producción, no una paleta nueva.
 */
const NAVY = '#003f5c';
const MAGENTA = '#bc5090';
const NARANJA = '#ff7c43';
const AMBAR = '#ffa600';
const AZUL = '#2f9bd8';

/** Una serie es de porcentaje (va como `spline` al eje secundario) si su nombre trae "%". */
const esPorcentaje = (s: SerieGrafico): boolean => s.nombre.includes('%');

/**
 * Infiere la forma del gráfico a partir de las series, replicando qué config
 * del legado le toca a cada bloque:
 * - 1 sola serie → barra horizontal simple (`clientesPorCultivoOptions`)
 * - 1 métrica base + N "%" → barra horizontal + spline(s) (`saldoPorCultivoOptions`, `saldoVencidoPorCultivoOptions`)
 * - 2+ métricas base → columnas verticales + spline (`resumenGeneralOptions`)
 */
function inferirTipo(bloque: BloqueGrafico): 'barra-simple' | 'barra-lineas' | 'columnas-lineas' {
  if (bloque.series.length === 1) return 'barra-simple';
  return bloque.series.filter((s) => !esPorcentaje(s)).length === 1 ? 'barra-lineas' : 'columnas-lineas';
}

/** Color de cada serie según su rol y su nombre — mismas reglas que el legado. */
function colorSerie(serie: SerieGrafico, unicaSerie: boolean): string {
  if (unicaSerie) return AZUL;
  if (esPorcentaje(serie)) return serie.nombre.includes('Vencido') ? AMBAR : NARANJA;
  return serie.nombre.includes('Vencido') ? MAGENTA : NAVY;
}

/**
 * Gráfica Highcharts para los bloques de reportes (Agro-Mix y Gestión Comercial).
 *
 * Highcharts es la misma librería del legado, y es lo que permite el combo que
 * pide el reporte: barra HORIZONTAL (`chart.type: 'bar'`, que invierte los ejes)
 * con las líneas de porcentaje encima. Es justo lo que ApexCharts no soporta
 * ("Horizontal bars are not supported in a mixed/combo chart"), y por eso las
 * barras desaparecían.
 */
@Component({
  selector: 'app-grafico-highcharts',
  standalone: true,
  imports: [],
  template: `
    <div class="flex flex-col h-full">
      <h3 class="text-[13px] font-semibold text-[var(--mis-text-secondary)] mb-2 uppercase tracking-wide leading-tight">
        {{ datos().titulo }}
      </h3>
      <div #chartEl class="flex-1 min-h-[300px]"></div>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; }
  `],
})
export class GraficoHighchartsComponent implements AfterViewInit {
  private readonly tema = inject(ThemeService);
  private readonly chartEl = viewChild.required<ElementRef<HTMLDivElement>>('chartEl');
  private chart: Chart | null = null;

  readonly datos = input.required<BloqueGrafico>();
  /** Emite la categoría (cultivo) clickeada — abre el detalle de clientes. */
  readonly puntoSeleccionado = output<string>();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.chart?.destroy());

    effect(() => {
      const bloque = this.datos();
      const oscuro = this.tema.oscuro();
      // El timeout deja que el contenedor tenga tamaño antes de medir.
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
    this.chart = Highcharts.chart(el, this.opciones(bloque, oscuro));
  }

  private opciones(bloque: BloqueGrafico, oscuro: boolean): Options {
    const tipo = inferirTipo(bloque);
    const unicaSerie = bloque.series.length === 1;

    // Tokens del tema (`tokens.css`): Highcharts no resuelve variables CSS en su config.
    const fondo = oscuro ? '#162034' : '#FFFFFF';
    const texto = oscuro ? '#A3B2C9' : '#5A6A85';
    const textoFuerte = oscuro ? '#E8EEF9' : '#304156';
    const linea = oscuro ? 'rgba(0,162,255,0.14)' : 'rgba(29,57,110,0.10)';

    const estiloTexto = { color: texto, fontSize: '11px' };
    const hayPorcentajes = bloque.series.some(esPorcentaje);

    const series: SeriesOptionsType[] = bloque.series.map((s) => {
      const color = colorSerie(s, unicaSerie);
      if (esPorcentaje(s)) {
        return {
          type: 'spline',
          name: s.nombre,
          data: s.datos as (number | null)[],
          yAxis: 1,
          color,
          marker: { enabled: true, radius: 3, fillColor: color },
        };
      }
      return {
        type: tipo === 'columnas-lineas' ? 'column' : 'bar',
        name: s.nombre,
        data: s.datos as (number | null)[],
        yAxis: 0,
        color,
      };
    });

    return {
      chart: {
        // `bar` invierte los ejes (barras horizontales); `column` las deja verticales.
        type: tipo === 'columnas-lineas' ? 'column' : 'bar',
        backgroundColor: fondo,
        zooming: { type: 'xy' },
        style: { fontFamily: 'inherit' },
      },
      title: { text: undefined },
      credits: { enabled: false },
      accessibility: { enabled: false },
      xAxis: {
        categories: bloque.categorias,
        crosshair: true,
        labels: { style: estiloTexto },
        lineColor: linea,
        tickColor: linea,
      },
      yAxis: [
        {
          title: { text: bloque.tituloEjeY ?? undefined, style: estiloTexto },
          labels: { formatter: formateadorEjeValor, style: estiloTexto },
          gridLineColor: linea,
        },
        {
          title: { text: undefined },
          labels: { format: '{value} %', style: estiloTexto },
          opposite: true,
          gridLineWidth: 0,
          visible: hayPorcentajes,
        },
      ],
      plotOptions: {
        column: { pointPadding: 0.2, groupPadding: 0.1, borderWidth: 0 },
        bar: { borderWidth: 0 },
        series: {
          cursor: 'pointer',
          point: {
            events: {
              click: (evento: PointClickEventObject) => {
                const categoria = String(evento.point?.category ?? '');
                if (categoria) this.puntoSeleccionado.emit(categoria);
              },
            },
          },
        },
      },
      legend: { enabled: !unicaSerie, itemStyle: { color: texto, fontWeight: '500' }, itemHoverStyle: { color: textoFuerte } },
      tooltip: {
        shared: true,
        backgroundColor: fondo,
        borderColor: linea,
        borderRadius: 10,
        style: { color: textoFuerte, fontSize: '12px' },
        formatter: formateadorTooltip,
      },
      series,
    };
  }
}

/** Miles/millones abreviados — el legado dividía entre 1e6 y sufijaba " M". */
function formateadorEjeValor(this: AxisLabelsFormatterContextObject): string {
  const valor = Number(this.value);
  if (!Number.isFinite(valor)) return String(this.value);
  if (Math.abs(valor) >= 1_000_000) return `${(valor / 1_000_000).toFixed(0)} M`;
  if (Math.abs(valor) >= 1_000) return `${(valor / 1_000).toFixed(0)} K`;
  return Highcharts.numberFormat(valor, 0, '.', ',');
}

/**
 * Mismo formato del legado: los "%" con 2 decimales, el resto como soles.
 *
 * Desde Highcharts 12 el `this` del formatter es el `Point` (ya no el viejo
 * `TooltipFormatterContextObject` con `.points`), así que para el tooltip
 * compartido las series hermanas se leen de `chart.hoverPoints`.
 */
const formateadorTooltip: TooltipFormatterCallbackFunction = function (this: Point): string {
  const puntos = this.series.chart.hoverPoints ?? [this];
  let html = `<b>${this.category}</b><br/>`;
  for (const punto of puntos) {
    const nombre = punto.series.name;
    const valor = punto.y ?? 0;
    const texto = nombre.includes('%')
      ? `${valor.toFixed(2)} %`
      : `S/ ${Highcharts.numberFormat(valor, 0, '.', ',')}`;
    html += `<span style="color:${punto.color}">●</span> ${nombre}: <b>${texto}</b><br/>`;
  }
  return html;
};
