import { colorSerieReporte } from '../../../../../../shared/ui/graficos/utils/paleta-colores.util';
import { FILAS_TARJETAS_CMG } from '../../actividad-diaria/components/Cartera/constantes/cartera.constantes';
import type { TarjetaCmgCartera } from '../../actividad-diaria/components/Cartera/models/cmg-cartera.model';
import type { BloqueGrafico } from '../../../../../../shared/ui/graficos/models/grafico-comun.model';

/** Mapeo de los payloads de Actividad Mensual. Son funciones puras: el service solo pide. */

/** Descarta lo que no sea dígito, signo o punto — la TAPP llega como `"42.07%"`. */
const aNumero = (v: unknown) => Number(String(v ?? '0').replace(/[^0-9.-]/g, '')) || 0;

/**
 * Tarjetas del encabezado de CMG Cartera mensual.
 *
 * Se diferencia de la versión diaria en cómo rotula la TAPP: acá siempre se
 * muestra un valor (con `—` si no llega) y el delta lleva signo explícito.
 */
export function tarjetasCmgCarteraMensual(
  filasTabla: Record<string, unknown>[],
  kpis: Record<string, unknown>,
): TarjetaCmgCartera[] {
  const filaSaldo = filasTabla[FILAS_TARJETAS_CMG.saldoMedio] as Record<string, unknown> | undefined;
  const filaTapp = filasTabla[FILAS_TARJETAS_CMG.tapp] as Record<string, unknown> | undefined;

  const saldoMedio = aNumero(filaSaldo?.[6]);
  const saldoMedioAnterior = aNumero(filaSaldo?.[5]);
  const deltaSaldo = saldoMedio - saldoMedioAnterior;

  const tappMes = aNumero(filaTapp?.[6]);
  const tappMinima = aNumero(kpis['tasaminima']);
  const deltaPbs = Math.round((tappMes - tappMinima) * 100);

  return [
    {
      etiqueta: 'Monto Desembolsado (miles PEN)',
      valor: aNumero(kpis['des_acum']) / 1000,
      comparativo: `Meta ${(aNumero(kpis['meta_des_acum']) / 1000).toLocaleString('es-PE', { maximumFractionDigits: 0 })}`,
      senal: 0,
      cumplimiento: kpis['cumpl_des_acum'] == null ? undefined : aNumero(kpis['cumpl_des_acum']),
    },
    {
      etiqueta: 'Ope. Desembolsada (Nro)',
      valor: aNumero(kpis['ope_acum_']),
      comparativo: `Meta ${aNumero(kpis['meta_ope_acum_']).toLocaleString('es-PE')}`,
      senal: 0,
      cumplimiento: kpis['cumpl_ope_acum'] == null ? undefined : aNumero(kpis['cumpl_ope_acum']),
    },
    {
      etiqueta: 'TAPP Mes / TAPP Mínima',
      valor: comoPorcentaje(filaTapp?.[6], tappMes),
      comparativo: `Mínima ${comoPorcentaje(kpis['tasaminima'], tappMinima)}`,
      senal: tappMes >= tappMinima ? 1 : -1,
      delta: `${conSigno(deltaPbs)} pbs`,
    },
    {
      etiqueta: 'Saldo Medio Vigente (miles PEN)',
      valor: saldoMedio,
      comparativo: `Mes anterior ${saldoMedioAnterior.toLocaleString('es-PE', { maximumFractionDigits: 0 })}`,
      senal: deltaSaldo >= 0 ? 1 : -1,
      delta: conSigno(Math.round(deltaSaldo)),
    },
  ];
}

/** Deja el texto del backend si ya trae `%`; si no, lo formatea. `—` cuando no llega nada. */
function comoPorcentaje(crudo: unknown, numero: number): string {
  const texto = String(crudo ?? '').trim();
  if (!texto) return '—';
  return texto.includes('%') ? texto : `${numero.toFixed(2)} %`;
}

function conSigno(valor: number): string {
  return `${valor >= 0 ? '+' : ''}${valor.toLocaleString('es-PE')}`;
}

/**
 * Los bloques de gráfico traen su `{categories, series}` serializado en
 * `headers`. A diferencia de la versión diaria, acá cada serie recibe su color
 * de la paleta compartida.
 */
export function seriesDeGraficoConColor(headers: string | undefined): Pick<BloqueGrafico, 'categorias' | 'series'> {
  if (!headers) return { categorias: [], series: [] };
  const datos = JSON.parse(headers) as {
    categories?: string[];
    series?: { name: string; data: (number | null)[] }[];
  };
  const series = datos.series ?? [];
  const esUnica = series.length === 1;
  return {
    categorias: datos.categories ?? [],
    series: series.map((s) => ({ nombre: s.name, datos: s.data, color: colorSerieReporte(s.name, esUnica) })),
  };
}
