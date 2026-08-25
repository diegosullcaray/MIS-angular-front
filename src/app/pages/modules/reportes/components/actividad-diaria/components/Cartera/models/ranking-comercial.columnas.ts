import type { ColumnaDinamica } from '../../../../../models/tabla-dinamica.model';

const decimal = { type: 'decimal' } as const;
const porcentaje = { type: 'percent' } as const;

/** Color plano por grupo — legado `ranking-comercial.util.ts` (`tablaTab1`). */
const PRODUCTIVIDAD = { background: '#2C3E50' };
const DESEMBOLSOS = { background: '#34495E' };
const VAR_SALDO = { background: '#1A5276' };
const TASAS = { background: '#0E6655' };

/**
 * Columnas de "Ranking Comercial" (`RS_RANK_COM_01`).
 *
 * El legado no toma las cabeceras del payload: usa siempre las suyas
 * (`tablaTab1`), porque tres de las columnas (`*_Semaforo`) las calcula el
 * cliente y el backend no las manda.
 */
export const COLUMNAS_RANKING_COMERCIAL: ColumnaDinamica[] = [
  { key: 'des_uuni', label: 'Unidad' },
  { key: 'des_ucor', label: 'Corredor' },
  { key: 'des_uter', label: 'Territorio' },
  {
    key: 'productividad',
    label: 'Productividad',
    style: PRODUCTIVIDAD,
    subs: [
      { key: 'prod_ind', label: 'Real', format: decimal, style: PRODUCTIVIDAD },
      { key: 'meta_produc', label: 'Meta Mes', format: decimal, style: PRODUCTIVIDAD },
      { key: 'TMMPROD', label: 'TMM', format: decimal, style: PRODUCTIVIDAD },
      { key: 'Percent_Cumpl', label: '% Avance', format: porcentaje, semaforoKey: 'Percent_Cumpl_Semaforo', style: PRODUCTIVIDAD },
    ],
  },
  {
    key: 'desembolsos',
    label: 'Desembolsos',
    style: DESEMBOLSOS,
    subs: [
      { key: 'mont_dese_2', label: 'Real', format: decimal, style: DESEMBOLSOS },
      { key: 'meta_desemb', label: 'Meta Mes', format: decimal, style: DESEMBOLSOS },
      { key: 'TMMDESEMB', label: 'TMM', format: decimal, style: DESEMBOLSOS },
      { key: 'percent_cumpl_desemb', label: '% Avance', format: porcentaje, semaforoKey: 'percent_cumpl_desemb_Semaforo', style: DESEMBOLSOS },
    ],
  },
  {
    key: 'var-saldo-vigente',
    label: 'Var. saldo vigente',
    style: VAR_SALDO,
    subs: [
      { key: 'HVSALVIGMN', label: 'Real', format: decimal, style: VAR_SALDO },
      { key: 'MetaVarSVDiaria', label: 'Meta Fecha', format: decimal, style: VAR_SALDO },
      { key: 'DistMetaFechaDi', label: 'Dist. Meta Fecha', format: decimal, style: VAR_SALDO },
      { key: 'metavarsvimensu', label: 'Meta Mensual', format: decimal, style: VAR_SALDO },
      { key: 'HVSALVIGMNTRI', label: 'Ult. 3M', format: decimal, style: VAR_SALDO },
      { key: 'percent_cumpl_varsalv', label: '% Avance', format: porcentaje, semaforoKey: 'percent_cumpl_varsalv_Semaforo', style: VAR_SALDO },
    ],
  },
  {
    key: 'gestion-tasas',
    label: 'Gestión Tasas',
    style: TASAS,
    subs: [
      { key: 'tapp_mes_2', label: 'Tapp Actual', format: porcentaje, style: TASAS },
      { key: 'TMMTAPP', label: 'TMM Tapp', format: decimal, style: TASAS },
      { key: 'tick_prom_2', label: 'Ticket Actual', format: decimal, style: TASAS },
      { key: 'TappMin', label: 'Tapp Mínima', style: TASAS },
      { key: 'TAPPVSMIN', label: 'Tapp vs Tapp Mínima', format: decimal, style: TASAS },
    ],
  },
];
