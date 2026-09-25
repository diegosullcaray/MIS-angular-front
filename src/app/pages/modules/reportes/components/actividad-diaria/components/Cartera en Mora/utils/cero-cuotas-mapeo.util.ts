import type { GraficoDashboardRevision } from '../constantes/cartera-mora.constantes';
import type { BloqueGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import type { TablaRegularResultadoRaw } from '../../../../../models/tabla-dinamica.model';
import type { KpiCeroCuotas } from '../models/cartera-en-mora.model';
import type { MapaCalorGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';

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
