import type { GraficoDashboardRevision } from '../constantes/cartera-mora.constantes';
import type { BloqueGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';

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
