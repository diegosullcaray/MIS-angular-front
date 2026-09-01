/** Códigos de reporte (`cod_rep`) de Tablero Digital. */
export const COD_TABLERO_DIGITAL = {
  /** `tabdig` — App Cliente y Home Banking, dos bloques sin filtros propios. */
  appClienteHomeBanking: ['TABDIG_01', 'TABDIG_02'],
  /** `tabdig-vr2` — vista general del canal. */
  vistaGeneralCanal: 'TABDIG_VR2_01',
  /** `gc-tabdig-vr2-ope` — gestión del canal. */
  gestionCanal: 'GCTABDIG_VR2_OPE_02',
  /** `viuw-gcor` — vista general de corresponsales. */
  vistaGeneralCorresponsal: 'RVIUWGCOR_01',
  /** `viuw-gcore` — gestión de corresponsales. */
  gestionCorresponsal: 'RVIUWGCORE_02',
  /** `det-corr` — detalle de corresponsales, paginado. */
  detalleCorresponsales: 'RDETCORR_01',
  /** Selector de periodo del Tablero Comercial. */
  periodosTableroComercial: 'RS_FECH',
  /** `tab-com` — Tablero Comercial, motor `table.regular`. */
  tableroComercial: 'RS_TAB_COM_01',
} as const;
