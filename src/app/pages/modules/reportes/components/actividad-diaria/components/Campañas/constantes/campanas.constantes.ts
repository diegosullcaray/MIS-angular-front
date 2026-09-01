/** Códigos de reporte (`cod_rep`) de Campañas. */
export const COD_CAMPANAS = {
  /** `apadrina` — pide el corte como `fecha`. */
  apadrinamiento: 'R_APADRINA_01',
  /** Opciones del selector de asesor de Mentoring, que salen del backend. */
  opcionesAsesorMentoring: 'SEL_JER_MENTORING_01',
  /** `mentoring` — mueve mucha data, va con el timeout largo. */
  mentoring: 'RMENTORIN_01',
  /** `age-com` — el bloque que alimenta las dos primeras pestañas, por `mode`. */
  agendamientoBases: 'RS_AGE_COM_01',
  /** `age-com` — detalle de bases vivas, con su filtro de rango (`nom`). */
  agendamientoDetalle: 'RS_AGE_COM_02',
  /** `age-com` — resumen por rango. */
  agendamientoResumen: 'RS_AGE_COM_03',
} as const;
