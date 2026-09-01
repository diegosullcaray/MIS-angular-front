/** Códigos de reporte (`cod_rep`) de Portafolio Reasignado. */
export const COD_PORTAFOLIO_REASIGNADO = {
  /** `mon-efec-reasig` — efectividad por tramos, motor `table.regular`. */
  efectividadPorTramos: 'RS_MON_EFECREASIG_03',
  /** `gest_cart_her` — resumen. */
  gestionResumen: 'RS_AGE_COM_CR_01',
  /** `gest_cart_her` — detalle, con sus filtros propios. */
  gestionDetalle: 'RS_AGE_COM_CR_03',
  /** `mon-efec-reasig` — resumen. */
  monitorResumen: 'RS_MON_EFECREASIG_01',
  /** `mon-efec-reasig` — detalle, con sus filtros propios. */
  monitorDetalle: 'RS_MON_EFECREASIG_02',
  /** Opciones de "Última Gestión", que el legado trae del backend. */
  opcionesUltimaGestion: 'SEL_EFEC_01',
} as const;
