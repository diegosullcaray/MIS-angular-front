/** Códigos de reporte (`cod_rep`) de Proyecciones. */
export const COD_PROYECCIONES = {
  /**
   * `proy_M1` — Proyección de Colocación (`com-map`, host `cra-v11`). El `_01` es el resumen, con
   * `fec`; el `_03` el detalle, paginado en el servidor (`pagen` + nodo completo, sin `fec`).
   */
  colocacionConFecha: 'PROYEC_COLREC_01',
  colocacionSinFecha: 'PROYEC_COLREC_03',
  /** `proy_M2` — Proyección Diaria de Colocación, dos bloques sin filtros propios. */
  diariaColocacion: ['PROYEC_DIACOLREC_01', 'PROYEC_DIACOLREC_02'],
} as const;
