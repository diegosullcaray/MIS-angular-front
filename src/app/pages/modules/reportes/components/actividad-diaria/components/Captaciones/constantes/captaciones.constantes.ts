/**
 * Códigos de reporte (`cod_rep`) de Captaciones.
 *
 * Uno por pantalla, salvo los reportes de dos bloques, que van como par en el
 * orden en que los consume el service. El comentario nombra la ruta del legado.
 */
export const COD_CAPTACIONES = {
  /** `capta-caract-canal-comercial`. */
  captacionCanalComercial: 'CARACT_CARTERA_01',
  /** `capta-caract-canal-operacional`. */
  captacionCanalOperaciones: 'CARACT_pas_01',
  /** `capta-canal` — strand deprecado (`reportData`). */
  captacionPorCanal: 'rda/administracion/captaciones/captacion_canal_01',
  /** `cmg-capta`. */
  cmgCaptacionesAgencias: 'GCMGCAP_01',
  /** `cmg-cli-pas` — pestaña de flujo. */
  clientesPasivosFlujo: 'CMG_CLI_PAS_01',
  /** `cmg-cli-pas` — pestaña de stock. */
  clientesPasivosStock: 'CMG_CLI_PAS_STOCK_02',
  /** `cmg-cli-pas` — detalle de un grupo del flujo. */
  clientesPasivosFlujoDetalle: 'CMG_CLI_PAS_DETA_01',
  /** `carterizacion` — el legado ignora las cabeceras del payload y usa las suyas. */
  gestionPasivoComercial: 'RS_CARTEPAS_01',
  /** `recserv-pas`. */
  recaudosServicios: 'RECSERV_PAS_01',
  /** `cap-segui-bp` — Banca Preferente. */
  seguimientoBancaPreferente: 'CAP_SEGUI_BP_01',
  /** `cap-segui-bp` — Red de Agencias. */
  seguimientoRedAgencias: 'CAP_SEGUI_FC_BP_01',
  /** `mon-salcap-com`. */
  vinculacionCartera: 'RS_MON_SALCAP_COM_01',
} as const;

/**
 * Gestión de Tasas Pasivas (`gst-pasiva`): dos bloques que comparten los
 * filtros del usuario y se distinguen por su `calc`.
 */
export const BLOQUES_TASAS_PASIVAS = [
  { codRep: 'GST_PASIVA_01', calc: 2 },
  { codRep: 'GST_PASIVA_02', calc: 1 },
] as const;

/** Panel de Operaciones (`tb-panel-ope`): dos bloques con el mismo filtro `prod`. */
export const BLOQUES_PANEL_OPERACIONES = ['TB_PANEL_OPE_01', 'TB_PANEL_OPE_02'] as const;
