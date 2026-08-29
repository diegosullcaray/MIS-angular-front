import type { BloqueGrafico } from '../../../../../../../../../../shared/ui/graficos/models/grafico-comun.model';

export interface TarjetaKpiTasas {
  etiqueta: string;
  valor: number | string;
  comparativo: string;
}

export interface TasasMesProductoResultado {
  graficos: BloqueGrafico[];
  tarjetas: TarjetaKpiTasas[];
}

export const TASAS_MES_PRODUCTO_VACIO: TasasMesProductoResultado = {
  graficos: [],
  tarjetas: [],
};

/** Extrae las tarjetas KPI a partir de los bloques de gráficos Highcharts de tasas por producto. */
export function extraerTarjetasTasasProducto(graficos: BloqueGrafico[]): TarjetaKpiTasas[] {
  if (!graficos || graficos.length === 0) return [];

  return graficos.map((g) => {
    const series = g.series ?? [];
    let ultimoValor: number | null = null;

    for (const s of series) {
      const validos = (s.datos ?? []).filter(
        (d: number | null | undefined): d is number => d !== null && d !== undefined && typeof d === 'number' && !isNaN(d)
      );
      if (validos.length > 0) {
        ultimoValor = validos[validos.length - 1];
        break;
      }
    }

    const valorStr = ultimoValor !== null ? `${ultimoValor.toFixed(2)} %` : '—';

    return {
      etiqueta: (g.titulo || 'Producto').trim(),
      valor: valorStr,
      comparativo: g.tituloEjeY || 'En porcentaje',
    };
  });
}
