/** Códigos de reporte (`cod_rep`) de Proyecciones. */
export const COD_PROYECCIONES = {
  /**
   * `proy_M1` — Proyección de Colocación. Mueve mucha data y alguno de sus dos
   * bloques puede volver vacío, así que van por `regularLento()`. El `_03` no
   * lleva `fec`.
   */
  colocacionConFecha: 'PROYEC_COLREC_01',
  colocacionSinFecha: 'PROYEC_COLREC_03',
  /** `proy_M2` — Proyección Diaria de Colocación, dos bloques sin filtros propios. */
  diariaColocacion: ['PROYEC_DIACOLREC_01', 'PROYEC_DIACOLREC_02'],
} as const;
