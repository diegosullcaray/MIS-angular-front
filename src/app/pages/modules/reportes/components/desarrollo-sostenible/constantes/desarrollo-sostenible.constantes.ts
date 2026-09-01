/** Códigos de reporte (`cod_rep`) de Desarrollo Sostenible. */
export const COD_DESARROLLO_SOSTENIBLE = {
  /** `pob-misional` / `prod-misional` — tabla simple. */
  misionalSimple: 'Monitor_Dese_misi_02',
  /** `pob-misional` / `prod-misional` — bloque de KPIs. */
  misionalKpi: 'Monitor_Dese_misi_01',
  /** `desemp-social` — pide el corte como `fec` del último día del mes. */
  desempenoSocial: 'DESEMP_SOC_01',
} as const;

/**
 * Columnas del bloque de KPIs misionales. El backend las nombra por posición
 * (`col_7`..`col_13`), no por concepto, así que el mapeo las traduce acá.
 */
export const COLUMNAS_KPI_MISIONAL = {
  meta: 'col_7',
  semaforoMeta: 'col_8',
  tmm: 'col_9',
  semaforoTmm: 'col_10',
  tam: 'col_11',
  semaforoTam: 'col_12',
  distanciaMeta: 'col_13',
} as const;
