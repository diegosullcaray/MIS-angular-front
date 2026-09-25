/** Códigos de reporte (`cod_rep`) de Portafolio Reasignado. */
export const COD_PORTAFOLIO_REASIGNADO = {
  /** `gest_cart_her` — resumen. */
  gestionResumen: 'RS_AGE_COM_CR_01',
  /** `gest_cart_her` — detalle paginado (pestaña "Detalle" de `cra-v11`, que pide el `_03`). */
  gestionDetalle: 'RS_AGE_COM_CR_03',
  /** `mon-efec-reasig` — resumen. */
  monitorResumen: 'RS_MON_EFECREASIG_01',
  /** `mon-efec-reasig` — detalle, con sus filtros propios. */
  monitorDetalle: 'RS_MON_EFECREASIG_02',
  /** Opciones de "Última Gestión", que el legado trae del backend. */
  opcionesUltimaGestion: 'SEL_EFEC_01',
} as const;
