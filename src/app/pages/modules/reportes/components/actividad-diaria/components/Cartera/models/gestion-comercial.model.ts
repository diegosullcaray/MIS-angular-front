import type { ColumnaDinamica, TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { BloqueGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';

const decimal = { type: 'decimal' } as const;
const entero = { type: 'integer' } as const;
const porcentaje = { type: 'percent' } as const;

/**
 * `RS_GEST_COM_01` alimenta dos tablas con el mismo `data` y distintas
 * columnas: el legado las declara fijas en `tablaTab1` y `tablaTab2`.
 */
export const COLUMNAS_GESTION_PRODUCCION: ColumnaDinamica[] = [
  { key: 'descripcion', label: 'Descripción' },
  { key: 'prod_ind', label: 'Product.', format: decimal },
  { key: 'Percent_Cumpl', label: '% Cump. Prod', format: porcentaje },
  { key: 'TMMPROD', label: 'TMM Prod.', format: decimal },
  { key: 'mont_dese_2', label: 'Desemb.', format: entero },
  { key: 'percentcumpldesembolsometadi', label: '% Cump. Desemb.', format: porcentaje },
  { key: 'TMMDESEMB', label: 'TMM Desemb.', format: entero },
  { key: 'tick_prom_2', label: 'Ticket', format: entero },
  { key: 'TMM_TICK', label: 'TMM Ticket', format: decimal },
  { key: 'tapp_mes_2', label: 'TAPP', format: porcentaje },
  { key: 'TMMTAPP', label: 'TMM TAPP', format: decimal },
  { key: 'Canc_vigente', label: 'Canc. Vig.', format: entero },
  { key: 'HRODAM', label: 'Rodamiento', format: entero },
  { key: 'sal_vig_2', label: 'Saldo Vig.', format: entero },
  { key: 'HVSALVIGMN', label: 'Var. Saldo Vig.', format: entero },
  { key: 'hvalvar_10256', label: 'Meta Fecha VarSal', format: entero },
  { key: 'distdiariacartvig', label: 'Dist. Meta Fecha', format: entero },
  { key: 'hvalvar_9000', label: 'Meta Var. Saldo Vig.', format: entero },
];

export const COLUMNAS_GESTION_CLIENTES: ColumnaDinamica[] = [
  { key: 'descripcion', label: 'Descripción' },
  { key: 'cli_stock_2', label: 'Cliente Stock', format: decimal },
  { key: 'TMMCLISTOCK', label: 'Var. clientes stock', format: decimal },
  { key: 'hvalvar_10257', label: 'Meta Fecha Var Clientes', format: decimal },
  { key: 'var_distancia_metadi', label: 'Dist. Meta Fecha', format: decimal },
  { key: 'hvalvar_10062', label: 'Meta Var. Stock Cliente', format: entero },
  { key: 'HNUMCLIN', label: 'Clientes Nuevos', format: entero },
  { key: 'Percent_Cumpl_clinuevo', label: '% Cump. Nuevos', format: porcentaje },
  { key: 'TMMCLINUEV', label: 'TMM Clientes Nuevos', format: entero },
];

/** Los siete gráficos, con el título que les pone la plantilla del legado. */
export const GRAFICOS_GESTION_COMERCIAL: { codRep: string; titulo: string }[] = [
  { codRep: 'GRAF_GEST_COM_01', titulo: 'Desembolsos Diarios' },
  { codRep: 'GRAF_GEST_COM_03', titulo: 'Variación Stock Clientes' },
  { codRep: 'GRAF_GEST_COM_04', titulo: 'Ingresos y Salidas' },
  { codRep: 'GRAF_GEST_COM_02', titulo: 'Saldo Cartera Vigente' },
  { codRep: 'GRAF_GEST_COM_05', titulo: 'Variación Stock Clientes (T)' },
  { codRep: 'GRAF_GEST_COM_07', titulo: 'Variación Cliente Stock' },
  { codRep: 'GRAF_GEST_COM_06', titulo: 'Ingresos y Salidas (T)' },
];

export interface GestionComercialResultado {
  /** Mismo `data` de `RS_GEST_COM_01`, que se pinta con dos juegos de columnas. */
  filas: Record<string, unknown>[];
  /** `RS_GEST_COM_02` — "Var Saldo Cartera Vigente"; trae sus propias cabeceras. */
  varSaldoVigente: TablaDinamicaResultado;
  /** `RS_GEST_COM_03` — "Var Clientes Stock"; ídem. */
  varClientesStock: TablaDinamicaResultado;
  graficos: BloqueGrafico[];
}

export const GESTION_COMERCIAL_VACIA: GestionComercialResultado = {
  filas: [],
  varSaldoVigente: { columnas: [], filas: [] },
  varClientesStock: { columnas: [], filas: [] },
  graficos: [],
};
