import type { GraficoDashboardRevision } from '../constantes/cartera-mora.constantes';
import type { BloqueGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import type { TablaRegularResultadoRaw } from '../../../../../models/tabla-dinamica.model';
import type { KpiCeroCuotas } from '../models/cartera-en-mora.model';
import type { MapaCalorGrafico, PorcionGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';

/** Extrae y parsea el JSON que el motor de gráficos manda dentro de una celda (`GRAF_ZCUO_*`). */
function jsonDeResultado(resultado: TablaRegularResultadoRaw | undefined): unknown {
  const primeraFila = resultado?.data?.[0] as Record<string, unknown> | undefined;
  const crudo = primeraFila ? Object.values(primeraFila)[0] : resultado?.headers;
  if (typeof crudo !== 'string' || !crudo.trim()) return null;
  try {
    return JSON.parse(crudo);
  } catch {
    return null;
  }
}

/** Colores del legado (`prepareVariacionCliStockChart`), degradé de navy a celeste. */
const COLORES_PARTICIPACION_PRODUCTO = [
  '#22486b',
  '#2b628f',
  '#3677a8',
  '#4b91cc',
  '#67aae4',
  '#8ec9f9',
  '#b5e0ff',
];

/** "Participación de Saldo por Producto" (`GRAF_ZCUO_01`): dona por `HDESREL`/`y` de la primera serie. */
export function participacionProductoDashboardRevision(
  resultado: TablaRegularResultadoRaw | undefined,
): PorcionGrafico[] {
  const data = jsonDeResultado(resultado) as { series?: Array<{ data?: unknown[] }> } | null;
  const puntos = data?.series?.[0]?.data;
  if (!Array.isArray(puntos)) return [];

  return puntos
    .map((punto) => punto as Record<string, unknown>)
    .map((punto, i) => ({
      nombre: String(punto['HDESREL'] ?? ''),
      valor: Number(punto['y']) || 0,
      color: COLORES_PARTICIPACION_PRODUCTO[i % COLORES_PARTICIPACION_PRODUCTO.length],
    }))
    .filter((porcion) => porcion.nombre && porcion.valor > 0);
}

/** Colores del legado (`prepareIngresosSalidasChart`), por orden de serie. */
const COLORES_CONCENTRACION_SALDOS = ['#4472c4', '#00b0f0', '#a6a6a6', '#ffc000', '#ed7d31'];

/** "Concentración de Saldos por Territorio" (`GRAF_ZCUO_02`): barras horizontales apiladas. */
export function concentracionSaldosDashboardRevision(
  resultado: TablaRegularResultadoRaw | undefined,
): BloqueGrafico | null {
  const data = jsonDeResultado(resultado) as
    | { categories?: unknown[]; series?: Array<{ name?: unknown; data?: unknown[] }> }
    | null;
  if (!Array.isArray(data?.categories) || !Array.isArray(data?.series)) return null;

  return {
    titulo: 'Concentración de Saldos por Territorio',
    categorias: data.categories.map((categoria) => String(categoria ?? '')),
    apilado: true,
    series: data.series.map((serie, i) => ({
      nombre: String(serie.name ?? ''),
      datos: (serie.data ?? []).map((valor) => (valor === null || valor === undefined ? null : Number(valor))),
      color: COLORES_CONCENTRACION_SALDOS[i % COLORES_CONCENTRACION_SALDOS.length],
    })),
  };
}

/** Compone un gráfico leyendo las columnas posicionales que entrega el legado. */
export function graficoDashboardRevision(
  config: GraficoDashboardRevision,
  filas: Record<string, unknown>[],
): BloqueGrafico {
  const valor = (fila: Record<string, unknown>, columna: number): number | null => {
    const crudo = Object.values(fila)[columna];
    if (crudo === null || crudo === undefined || crudo === '') return null;
    const numero = Number(crudo);
    return Number.isFinite(numero) ? (config.enMillones ? numero / 1_000_000 : numero) : null;
  };

  return {
    titulo: config.titulo,
    categorias: filas.map((fila) => String(Object.values(fila)[1] ?? '')),
    series: config.series.map((serie) => ({
      nombre: serie.nombre,
      datos: filas.map((fila) => valor(fila, serie.columna)),
      color: serie.color,
    })),
  };
}

/** Convierte el JSON de los mapas de calor en un contrato apto para la vista. */
export function mapaCalorDashboardRevision(
  resultado: TablaRegularResultadoRaw | undefined,
  titulo: string,
  ejeYInvertido: boolean,
): MapaCalorGrafico | null {
  const primeraFila = resultado?.data?.[0] as Record<string, unknown> | undefined;
  const crudo = primeraFila ? Object.values(primeraFila)[0] : resultado?.headers;
  if (typeof crudo !== 'string' || !crudo.trim()) return null;

  try {
    const data = JSON.parse(crudo) as {
      categories?: unknown[];
      series?: Array<{ name?: unknown; data?: unknown[] }>;
    };
    if (!Array.isArray(data.categories) || !Array.isArray(data.series)) return null;

    return {
      titulo,
      categoriasX: data.categories.map((categoria) => String(categoria ?? '')),
      categoriasY: data.series.map((serie) => String(serie.name ?? '')),
      valores: data.series.map((serie) => (serie.data ?? []).map((valor) => Number(valor) || 0)),
      ejeYInvertido,
    };
  } catch {
    return null;
  }
}

/** Las cuatro KPI salen de la primera fila de `RS_CARD_ZCUO_01`, igual que el legado. */
export function kpisCeroCuotas(filas: readonly Record<string, unknown>[]): KpiCeroCuotas[] {
  const fila = filas[0];
  const numero = (clave: string): number => {
    const valor = Number(fila?.[clave]);
    return Number.isFinite(valor) ? valor : 0;
  };

  return [
    {
      etiqueta: 'Total Cero Cuotas (S/)',
      actual: numero('saldo_act'),
      anterior: numero('saldo_ant'),
      variacion: numero('dif_saldo'),
      favorableCuandoBaja: false,
    },
    {
      etiqueta: 'Cero Cuotas Nuevo (S/)',
      actual: numero('zcuonuevo_act'),
      anterior: numero('zcuonuevo_ant'),
      variacion: numero('dif_zcuonuevo'),
      favorableCuandoBaja: false,
    },
    {
      etiqueta: 'Hasta 60 días (S/)',
      actual: numero('men60_act'),
      anterior: numero('men60_ant'),
      variacion: numero('dif_men60'),
      favorableCuandoBaja: true,
    },
    {
      etiqueta: 'Mayor a 60 días atraso (S/)',
      actual: numero('may60_act'),
      anterior: numero('may60_ant'),
      variacion: numero('dif_may60'),
      favorableCuandoBaja: true,
    },
  ];
}
