/** Códigos y parámetros fijos de Resumen de Movilidad. */
export const COD_RESUMEN_MOVILIDAD = {
  /** `resn-mov` — comercial, paginado. */
  comercial: 'RESNMOV_01',
  /**
   * `resn-movr` — recuperaciones. El host `cra-v6` descarta la jerarquía y
   * consulta por el documento de la persona, que va tanto en `cod_rel` como
   * dentro de `secuency`.
   */
  recuperaciones: 'RESNMOVR_01',
} as const;

/** `tip_cod` con el que el backend identifica a una persona por su documento. */
export const TIP_COD_PERSONA = 2;
