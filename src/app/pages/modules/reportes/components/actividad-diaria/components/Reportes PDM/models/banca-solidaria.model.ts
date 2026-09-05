import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { BloqueGrafico, PorcionGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';

/**
 * KPIs y gráficos de "Gestión de Banca Solidaria" — legado
 * `banca-solidaria.component.ts` (`setKpiValues`, `updateDonutChart`,
 * `updateBarChart`).
 *
 * Los tres salen de la MISMA fila: la primera de `GRBSOLI_01`, que es la de
 * totales. No hay bloques aparte para las tarjetas ni para las gráficas.
 */
export interface KpisBancaSolidaria {
  saldoVigente: number;
  montoDesembolsado: number;
  ticketPromedio: number;
  numeroClientes: number;
  /** Llega como fracción; el legado la pinta como `tappmes * 100`. */
  tasaMes: number;
}

export const KPIS_BANCA_SOLIDARIA_VACIOS: KpisBancaSolidaria = {
  saldoVigente: 0,
  montoDesembolsado: 0,
  ticketPromedio: 0,
  numeroClientes: 0,
  tasaMes: 0,
};

export interface BancaSolidariaResultado {
  tabla: TablaDinamicaResultado;
  kpis: KpisBancaSolidaria;
  /** Dona "Estado de Renovación (Base Inicial)". */
  estadoRenovacion: PorcionGrafico[];
  /** Columnas "Antigüedad de Cliente". */
  antiguedadCliente: BloqueGrafico;
}

/** Los cuatro estados de la dona, con los colores exactos del legado. */
const ESTADOS_RENOVACION: readonly { clave: string; nombre: string; color: string }[] = [
  { clave: 'Porcentaje_Renovados', nombre: 'Renovados', color: '#4CB848' },
  { clave: 'Porcentaje_PorRenovar', nombre: 'Por Renovar', color: '#004481' },
  { clave: 'Porcentaje_Vencidos', nombre: 'Vencidos', color: '#EF4444' },
  { clave: 'Porcentaje_VencenHoy', nombre: 'Vencen Hoy', color: '#F59E0B' },
];

/** Las tres barras de antigüedad, en el orden de `xAxis.categories` del legado. */
const ANTIGUEDADES: readonly { clave: string; categoria: string }[] = [
  { clave: 'conteo_ant_cli_nuev', categoria: 'Nuevos' },
  { clave: 'conteo_ant_cli_recurr', categoria: 'Recurrentes' },
  { clave: 'conteo_ant_cli_repre', categoria: 'Recuperados' },
];

/** Color institucional de la serie de antigüedad (legado `color: '#004481'`). */
const AZUL_INSTITUCIONAL = '#004481';

/** Todo lo que el legado deriva de la fila de totales de `GRBSOLI_01`. */
export function derivadosDeFilaTotal(filas: readonly Record<string, unknown>[]): Omit<BancaSolidariaResultado, 'tabla'> {
  const fila = filas[0];

  const num = (clave: string): number => {
    const valor = Number(fila?.[clave]);
    return Number.isFinite(valor) ? valor : 0;
  };

  return {
    kpis: fila
      ? {
          saldoVigente: num('sal_vig_bs'),
          montoDesembolsado: num('mod_desem_bs'),
          ticketPromedio: num('tick_prom_bs'),
          numeroClientes: num('cont_cli_gr_bs'),
          tasaMes: num('tapp_mes_bs'),
        }
      : KPIS_BANCA_SOLIDARIA_VACIOS,
    estadoRenovacion: ESTADOS_RENOVACION.map(({ clave, nombre, color }) => ({
      nombre,
      valor: num(clave),
      color,
    })),
    antiguedadCliente: {
      titulo: 'Antigüedad de Cliente',
      categorias: ANTIGUEDADES.map((a) => a.categoria),
      series: [{ nombre: 'Clientes', datos: ANTIGUEDADES.map((a) => num(a.clave)), color: AZUL_INSTITUCIONAL }],
    },
  };
}

export const BANCA_SOLIDARIA_VACIA: BancaSolidariaResultado = {
  tabla: { columnas: [], filas: [] },
  ...derivadosDeFilaTotal([]),
};
