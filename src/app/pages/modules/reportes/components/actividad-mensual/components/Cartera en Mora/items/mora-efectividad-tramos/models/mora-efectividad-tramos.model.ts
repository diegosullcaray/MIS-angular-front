import type { BloqueGrafico } from '../../../../../../../../../../shared/ui/graficos/models/grafico-comun.model';

export interface TarjetaKpiMoraEfectividad {
  etiqueta: string;
  valor: string;
  comparativo: string;
}

export interface MoraEfectividadTramosResultado {
  graficos: BloqueGrafico[];
  tarjetas: TarjetaKpiMoraEfectividad[];
}

export const MORA_EFECTIVIDAD_TRAMOS_VACIO: MoraEfectividadTramosResultado = {
  graficos: [],
  tarjetas: [],
};

/** Extrae las tarjetas KPI a partir de los bloques de gráficos Highcharts de mora y efectividad por tramos. */
export function extraerTarjetasMoraEfectividad(graficos: BloqueGrafico[]): TarjetaKpiMoraEfectividad[] {
  if (!graficos || graficos.length === 0) return [];

  return graficos.map((g) => {
    const series = g.series ?? [];
    let ultimosValidos: number[] = [];

    for (const s of series) {
      const validos = (s.datos ?? []).filter(
        (d: number | null | undefined): d is number => d !== null && d !== undefined && typeof d === 'number' && !isNaN(d)
      );
      if (validos.length > 0) {
        ultimosValidos = validos;
        break;
      }
    }

    const n = ultimosValidos.length;
    const ultimoValor = n > 0 ? ultimosValidos[n - 1] : null;
    const penultimoValor = n > 1 ? ultimosValidos[n - 2] : null;

    const esPct = (g.tituloEjeY ?? '').toLowerCase().includes('porcentaje') || g.titulo.includes('%');
    let valorStr = '—';
    let comparativo = g.tituloEjeY || (esPct ? 'En porcentaje' : 'En miles');

    if (ultimoValor !== null) {
      if (esPct) {
        valorStr = `${ultimoValor.toFixed(2)} %`;
        if (penultimoValor !== null) {
          const dif = ultimoValor - penultimoValor;
          comparativo = `Var. mes: ${dif >= 0 ? '+' : ''}${dif.toFixed(2)}%`;
        }
      } else {
        const absVal = Math.abs(ultimoValor);
        valorStr = absVal >= 1_000_000
          ? `${(ultimoValor / 1_000_000).toFixed(2)} M`
          : absVal >= 1_000
          ? `${(ultimoValor / 1_000).toFixed(1)} k`
          : ultimoValor.toLocaleString('en-US', { maximumFractionDigits: 0 });
        if (penultimoValor !== null) {
          const dif = ultimoValor - penultimoValor;
          const absDif = Math.abs(dif);
          const difStr = absDif >= 1_000 ? `${(dif / 1_000).toFixed(1)} k` : dif.toLocaleString('en-US');
          comparativo = `Var. mes: ${dif >= 0 ? '+' : ''}${difStr}`;
        }
      }
    }

    return {
      etiqueta: (g.titulo || 'Métrica').trim(),
      valor: valorStr,
      comparativo,
    };
  });
}
