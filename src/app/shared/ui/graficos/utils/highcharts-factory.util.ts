/**
 * Fábrica de configuraciones de Highcharts.
 *
 * Acá se centraliza todo lo repetitivo (fondo, tipografía, ejes, tooltip corporativo, paleta).
 * Los componentes de reporte nunca arman un `Highcharts.Options` a mano: le pasan data simple a
 * `<app-grafico-mixto>` / `<app-grafico-pie>`, y esos llaman a estas funciones. Si mañana hay que
 * cambiar el estilo de todas las barras del sistema, se cambia una sola vez acá.
 */
// El build ESM de Highcharts 13 solo expone `default` en runtime, pero sus
// tipos son exports con nombre — de ahí la importación partida en dos.
import Highcharts from 'highcharts';
import type {
  AxisLabelsFormatterContextObject,
  Options,
  Point,
  SeriesOptionsType,
  TooltipFormatterCallbackFunction,
} from 'highcharts';
import type {
  BloqueGrafico,
  FormatoValor,
  OpcionesGrafico,
  PorcionGrafico,
  SerieGrafico,
} from '../models/grafico-comun.model';
import { AZUL, PALETA_SERIES, colorSerieReporte, esPorcentaje, tokensTema } from './paleta-colores.util';

/**
 * Infiere la forma del gráfico a partir de las series, replicando qué config del legado le toca
 * a cada bloque:
 * - 1 sola serie → barra horizontal simple (`clientesPorCultivoOptions`)
 * - 1 métrica base + N "%" → barra horizontal + spline(s) (`saldoPorCultivoOptions`, `saldoVencidoPorCultivoOptions`)
 * - 2+ métricas base → columnas verticales + spline (`resumenGeneralOptions`)
 */
function inferirTipo(series: readonly SerieGrafico[]): 'barra' | 'columna' {
  if (series.length === 1) return 'barra';
  return series.filter((s) => !esPorcentaje(s.nombre)).length === 1 ? 'barra' : 'columna';
}

/**
 * Base común a todos los gráficos: sin título ni créditos, tipografía heredada y tooltip
 * con los colores del tema. `fondoTransparente` sirve para los gráficos embebidos en tarjetas
 * que ya traen su propio fondo (dashboard del analista).
 */
export function opcionesBase(oscuro: boolean, fondoTransparente = false): Options {
  const { fondo, texto, textoFuerte, linea } = tokensTema(oscuro);
  return {
    chart: {
      backgroundColor: fondoTransparente ? 'transparent' : fondo,
      style: { fontFamily: 'inherit' },
    },
    title: { text: undefined },
    credits: { enabled: false },
    accessibility: { enabled: false },
    tooltip: {
      backgroundColor: fondo,
      borderColor: linea,
      borderRadius: 10,
      style: { color: textoFuerte, fontSize: '12px' },
    },
    legend: {
      itemStyle: { color: texto, fontWeight: '500' },
      itemHoverStyle: { color: textoFuerte },
    },
  };
}

/**
 * Gráfico de barras/columnas/líneas a partir de un `BloqueGrafico`.
 *
 * Highcharts es lo que permite el combo que pide el reporte: barra HORIZONTAL
 * (`chart.type: 'bar'`, que invierte los ejes) con las líneas de porcentaje encima. Es justo lo
 * que ApexCharts no soporta ("Horizontal bars are not supported in a mixed/combo chart"), y por
 * eso las barras desaparecían.
 */
export function opcionesMixto(bloque: BloqueGrafico, oscuro: boolean, config: OpcionesGrafico = {}): Options {
  const { tipo = 'auto', formato = 'soles', fondoTransparente = false, apilado = false } = config;
  const esApilado = apilado || Boolean(bloque.apilado);
  const base = opcionesBase(oscuro, fondoTransparente);
  const { texto, textoFuerte, linea } = tokensTema(oscuro);
  const forma = tipo === 'auto' ? inferirTipo(bloque.series) : tipo;

  const unicaSerie = bloque.series.length === 1;
  const estiloTexto = { color: texto, fontSize: '11px' };
  // En modo `linea` no hay eje secundario: todas las series comparten el eje de valores.
  // Ahí van las de porcentaje y las que lo pidan explícitamente (`secundaria`).
  const enEjeSecundario = (s: SerieGrafico) => forma !== 'linea' && (s.secundaria ?? esPorcentaje(s.nombre));
  const secundarias = bloque.series.filter(enEjeSecundario);
  // El eje secundario se rotula en "%" solo si TODO lo que va ahí es porcentaje.
  const ejeSecundarioEnPorcentaje = secundarias.length > 0 && secundarias.every((s) => esPorcentaje(s.nombre));
  // `bar` invierte los ejes (barras horizontales); `column` las deja verticales.
  const tipoBase = forma === 'columna' ? 'column' : forma === 'linea' ? 'spline' : 'bar';

  const series: SeriesOptionsType[] = bloque.series.map((serie, i) => {
    let color = serie.color;
    if (!color) {
      const nombreLower = (serie.nombre ?? '').toLowerCase();
      if (nombreLower.includes('real')) {
        color = '#0284C7'; // Azul para barras Real
      } else if (nombreLower.includes('meta') || nombreLower.includes('ppto') || nombreLower.includes('presupuesto')) {
        color = '#1D396E'; // Navy para Meta
      } else {
        color = '#0284C7'; // Azul corporativo por defecto
      }
    }

    if (enEjeSecundario(serie)) {
      return {
        type: 'spline',
        name: serie.nombre,
        data: serie.datos,
        yAxis: 1,
        color,
        marker: { enabled: true, radius: 3.5, fillColor: color },
        dataLabels: {
          enabled: true,
          formatter: function (this: Point) {
            const valor = Number(this.y);
            if (!Number.isFinite(valor)) return '';
            if (ejeSecundarioEnPorcentaje || esPorcentaje(serie.nombre)) {
              return `${valor.toFixed(1)}%`;
            }
            if (formato === 'soles') {
              return Math.abs(valor) >= 1_000_000
                ? `${(valor / 1_000_000).toFixed(1)} M`
                : Math.abs(valor) >= 1_000
                ? `${(valor / 1_000).toFixed(0)} k`
                : Highcharts.numberFormat(valor, 0, '.', ',');
            }
            return Highcharts.numberFormat(valor, 0, '.', ',');
          },
          style: { fontSize: '10px', fontWeight: 'bold', color },
        },
      };
    }
    return {
      type: tipoBase,
      name: serie.nombre,
      data: serie.datos,
      yAxis: 0,
      color,
      dataLabels: {
        enabled: true,
        formatter: function (this: Point) {
          const valor = Number(this.y);
          if (!Number.isFinite(valor) || valor === 0) return '';
          if (esPorcentaje(serie.nombre)) {
            return `${valor.toFixed(1)}%`;
          }
          if (esApilado) {
            return Math.abs(valor) >= 1_000_000
              ? `${(Math.abs(valor) / 1_000_000).toFixed(1)} M`
              : Math.abs(valor) >= 1_000
              ? `${(Math.abs(valor) / 1_000).toFixed(0)} k`
              : Highcharts.numberFormat(Math.abs(valor), 0, '.', ',');
          }
          if (formato === 'soles') {
            return Math.abs(valor) >= 1_000_000
              ? `${(valor / 1_000_000).toFixed(1)} M`
              : Math.abs(valor) >= 1_000
              ? `${(valor / 1_000).toFixed(0)} k`
              : Highcharts.numberFormat(valor, 0, '.', ',');
          }
          return Highcharts.numberFormat(valor, 0, '.', ',');
        },
        style: {
          fontSize: '10px',
          fontWeight: 'bold',
          textOutline: 'none',
          color: color,
          ...(esApilado ? { color: '#ffffff' } : {}),
        },
      },
      ...(forma === 'linea' ? { connectNulls: true, marker: { enabled: true, radius: 3 } } : {}),
    };
  });

  return {
    ...base,
    chart: { ...base.chart, type: tipoBase, zooming: { type: 'xy' } },
    title: {
      text: bloque.titulo ?? undefined,
      align: 'center',
      style: {
        color: oscuro ? '#E8EEF9' : '#164D90',
        fontWeight: 'bold',
        fontSize: '16px',
      },
    },
    subtitle: bloque.subtitulo
      ? {
          text: bloque.subtitulo,
          useHTML: true,
          align: 'right',
          style: { color: '#16a34a', fontSize: '13px' },
        }
      : undefined,
    xAxis: {
      categories: bloque.categorias,
      crosshair: true,
      labels: {
        rotation: -45,
        style: estiloTexto,
      },
      lineColor: linea,
      tickColor: linea,
    },
    yAxis: [
      {
        title: { text: bloque.tituloEjeY ?? 'En miles', style: { ...estiloTexto, fontWeight: 'bold' } },
        labels: { formatter: formateadorEjeValor, style: estiloTexto },
        gridLineColor: linea,
        ...(esApilado
          ? {
              plotLines: [{ value: 0, color: linea, width: 2, zIndex: 5 }],
              stackLabels: {
                enabled: true,
                useHTML: true,
                formatter: function (this: any) {
                  const val = Number(this.total);
                  if (!Number.isFinite(val) || val === 0) return '';
                  const absVal = Math.abs(val);
                  const texto =
                    absVal >= 1_000_000
                      ? `${(val / 1_000_000).toFixed(1)} M`
                      : absVal >= 1_000
                      ? `${(val / 1_000).toFixed(1)} k`
                      : Highcharts.numberFormat(val, 0, '.', ',');
                  const bgColor = this.isNegative ? '#ef4444' : '#10b981';
                  return `<div style="background-color:${bgColor}; color:#ffffff; padding:2px 6px; border-radius:4px; font-weight:bold; font-size:10px; box-shadow:0 1px 2px rgba(0,0,0,0.2);">${texto}</div>`;
                },
              },
            }
          : {}),
      },
      {
        title: {
          text: secundarias.length > 0 ? (ejeSecundarioEnPorcentaje ? '%' : undefined) : (bloque.tituloEjeY ?? 'En miles'),
          style: { ...estiloTexto, fontWeight: 'bold' },
        },
        labels: ejeSecundarioEnPorcentaje
          ? { format: '{value} %', style: estiloTexto }
          : { formatter: formateadorEjeValor, style: estiloTexto },
        opposite: true,
        gridLineWidth: 0,
        visible: true,
        ...(secundarias.length === 0 ? { linkedTo: 0 } : {}),
      },
    ],
    plotOptions: {
      column: {
        ...(esApilado ? { stacking: 'normal' } : {}),
        pointPadding: 0.2,
        groupPadding: 0.1,
        borderWidth: 0,
      },
      bar: {
        ...(esApilado ? { stacking: 'normal' } : {}),
        borderWidth: 0,
      },
      series: { cursor: 'pointer' },
    },
    legend: {
      ...base.legend,
      enabled: true,
      symbolRadius: 0,
    },
    tooltip: { ...base.tooltip, shared: true, formatter: formateadorTooltip(formato) },
    series,
  };
}

/** Torta/dona: leyenda abajo, sin etiquetas sobre las porciones. */
export function opcionesPie(porciones: readonly PorcionGrafico[], oscuro: boolean, config: OpcionesGrafico = {}): Options {
  const base = opcionesBase(oscuro, config.fondoTransparente ?? false);
  return {
    ...base,
    chart: { ...base.chart, type: 'pie' },
    legend: { ...base.legend, enabled: true, align: 'center', verticalAlign: 'bottom', layout: 'horizontal' },
    plotOptions: {
      pie: {
        showInLegend: true,
        dataLabels: { enabled: false },
        borderWidth: 0,
        ...(config.dona ? { innerSize: '65%' } : {}),
      },
    },
    series: [
      {
        type: 'pie',
        name: 'Total',
        data: porciones.map((p, i) => ({
          name: p.nombre,
          y: p.valor,
          color: p.color ?? PALETA_SERIES[i % PALETA_SERIES.length],
        })),
      },
    ],
  };
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
 * Mismo formato del legado: los "%" con 2 decimales, el resto según `formato` (soles en los
 * reportes de cartera, número pelado donde la métrica no es dinero).
 *
 * Desde Highcharts 12 el `this` del formatter es el `Point` (ya no el viejo
 * `TooltipFormatterContextObject` con `.points`), así que para el tooltip compartido las series
 * hermanas se leen de `chart.hoverPoints`.
 */
function formateadorTooltip(formato: FormatoValor): TooltipFormatterCallbackFunction {
  return function (this: Point): string {
    const puntos = this.series.chart.hoverPoints ?? [this];
    let html = `<b>${this.category}</b><br/>`;
    for (const punto of puntos) {
      const nombre = punto.series.name;
      const valor = punto.y ?? 0;
      const numero = Highcharts.numberFormat(valor, 0, '.', ',');
      const texto = esPorcentaje(nombre)
        ? `${valor.toFixed(2)} %`
        : formato === 'soles'
          ? `S/ ${numero}`
          : numero;
      html += `<span style="color:${punto.color}">●</span> ${nombre}: <b>${texto}</b><br/>`;
    }
    return html;
  };
}
