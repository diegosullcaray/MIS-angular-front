/** Códigos de reporte (`cod_rep`) de Avance Comercial. */
export const COD_AVANCE_COMERCIAL = {
  /**
   * `mon-desem` — Monitor de Metas de Desembolso: cuatro bloques. Los tres
   * primeros llevan `tipmet: 1`; el cuarto va sin filtros propios.
   */
  monitorMetasDesembolso: ['Monitor_Dese_01', 'Monitor_Dese_02', 'Monitor_Dese_03', 'Monitor_Dese_04'],
  /** `mon-repro` — Monitor de Reprogramados, con su filtro de tipo. */
  monitorReprogramados: 'RS_MON_REP_01',
} as const;
