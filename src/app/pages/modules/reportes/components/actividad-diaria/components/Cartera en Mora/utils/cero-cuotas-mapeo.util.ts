import type { GraficoDashboardRevision } from '../constantes/cartera-mora.constantes';
import type { BloqueGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import type { TablaRegularResultadoRaw } from '../../../../../models/tabla-dinamica.model';

export interface MapaCalorCeroCuotas {
  titulo: string;
  categoriasX: string[];
  categoriasY: string[];
  valores: number[][];
  /** El último ajuste STG invierte el eje Y también para el mapa de Oriente. */
  ejeYInvertido: boolean;
}

/**
 * Arma un `BloqueGrafico` del Dashboard en Revisión leyendo las columnas por
 * posición, como el legado: el `data` de esos bloques no trae claves estables.
 * La categoría de cada punto es la columna 1.
 */
export function graficoDashboardRevision(
  config: GraficoDashboardRevision,
  filas: Record<string, unknown>[],
): BloqueGrafico {
  const valor = (fila: Record<string, unknown>, columna: number): number | null => {
    const crudo = Object.values(fila)[columna];
    if (crudo === null || crudo === undefined) return null;
    return config.enMillones ? Number(crudo) / 1_000_000 : Number(crudo);
  };

  return {
    titulo: config.titulo,
    categorias: filas.map((fila) => String(Object.values(fila)[1] ?? '')),
    series: config.series.map((s) => ({
      nombre: s.nombre,
      datos: filas.map((fila) => valor(fila, s.columna)),
      color: s.color,
    })),
  };
}

/**
 * El backend entrega el mapa como JSON dentro de la primera celda de `data`
 * (y, sin filas, dentro de `headers`). Conserva exactamente ese contrato STG.
 */
export function mapaCalorDashboardRevision(
  resultado: TablaRegularResultadoRaw | undefined,
  titulo: string,
  ejeYInvertido: boolean,
): MapaCalorCeroCuotas | null {
  const primeraFila = resultado?.data?.[0] as Record<string, unknown> | undefined;
  const crudo = primeraFila ? Object.values(primeraFila)[0] : resultado?.headers;
  if (typeof crudo !== 'string' || !crudo.trim()) return null;

  try {
    const data = JSON.parse(crudo) as { categories?: unknown[]; series?: Array<{ name?: unknown; data?: unknown[] }> };
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
