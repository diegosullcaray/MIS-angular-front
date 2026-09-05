/**
 * Códigos de reporte (`cod_rep`) de Actividad Mensual.
 *
 * Cada clave nombra la pantalla; el comentario, la ruta del legado y el host
 * `cra-*` del que cuelga — que es lo que hace falta para rastrearla. Los
 * services solo arman la petición y toman el código de acá.
 */

/** Reportes del motor "mixto" (`regularData`). */
export const COD_MENSUAL_CRA = {
  /** `app_uso_m`, host `cra-v1p1`. */
  planDatos: 'P_Datos_01',
  /** `huella-carbono-m`, host `cra-v3`. */
  huellaCarbono: 'HCARBONO_01',
  /** `cmg-capta`, host `cra-v3`. */
  cmgCaptaciones: 'GCMGCAP_01',
  /** `seg-bp-men`, host `cra-v3`. */
  seguimientoBp: 'CAP_SEGUI_BP_01',
  /** `capta-caract-canal-comercial-m`, host `cra-v1p1`. */
  captacionCanalComercial: 'CARACT_CARTERA_M_01',
  /** `capta-caract-canal-operacional-m`, host `cra-v1p1`. */
  captacionOperacional: 'CARACT_pas_M_01',
  /** `rep-aut-tas`, host `cra-v1p1`. */
  rankingAutonomiasTasas: 'reporte_autonomia_new_01',
  /** `seg_comite`, host `cra-v3`. */
  comiteCreditos: 'SEGUI_COMITE_01',
  /** `cmg-mora`, host `cra-v1p1`. */
  cmgCarteraMora: 'cuadro_Variable_M_01',
  /** `cmg-mora-simp-m`, host `cra-v1p1`. */
  cmgCarteraMoraSinImpulsa: 'cmg_mora_simp_m_01',
  /** `sema-cosechas`, host `cra-v1p1`. */
  semaforoCosechas: 'COSESEMAFORO_01',
  /** `desemp-social`, host `cra-v3`. */
  desempenoSocial: 'DESEMP_SOC_01',
  /** `cmg_cliente_flujo`, host `cra-v3`. */
  cmgClientesFlujo: 'CMG_CLIF_01',
  /** `res-un`, host `cra-v1p1`. */
  resultadosUnidadNegocio: 'resultado_unidad_negocio_rma_01',
  /** `rank-kay`, host `cra-v1p8`. */
  rankingKaypachaComercial: 'rankKay_01',
  /** `rank-kay-ope`, host `cra-v1p8`. */
  rankingKaypachaOperaciones: 'rankKayOpe_01',
  /** `rank-kay-recu`, host `cra-v1p8`. */
  rankingKaypachaRecuperaciones: 'rankKayrecu_01',
} as const;

/** Reportes del strand deprecado (`reportData`) y de gráficos (`graphicData`). */
export const COD_MENSUAL_DEPRECADO = {
  /** `cart-prod`, host `cra-v3` — tabla. */
  carteraProductoTabla: 'rma/administracion/Cartera/cartera_producto_rma_02',
  /** `cart-prod`, host `cra-v3` — gráficos. */
  carteraProductoGraficos: 'rma/administracion/Cartera/cartera_producto_rma_01',
  /** `tp-mes`, host `cra-v3`. */
  tasasMesProducto: 'rma/administracion/Cartera/tasa_producto_rma_01',
  /** `graf-cosechas`, host `cra-v3`. */
  evolutivoCosechas: 'rma/administracion/Riesgos/grafico_cosechas_01',
  /** `mor-efe`, host `cra-v3`. */
  moraEfectividadTramos: 'rma/administracion/Mora/mora_efectividad_tramos_rma_01',
  /** `graf-dashboard-CN`, host `cra-v3`. */
  dashboardCeroCuotaNueva: 'rma/administracion/mora/Dashboard_rma_01',
  /** `cmg-cli`, host `cra-v2`. */
  cmgClientesActivo: 'rma/administracion/Clientes/cmg_clientes_rma_01',
} as const;

/** Reportes de varios bloques: el orden del array es el de las tablas que devuelven. */
export const COD_MENSUAL_MULTIBLOQUE = {
  /** `gest_cart_her-flujo` (`RS_AGE_COM_CRM_F`), host `cra-v11`. */
  gestionCarteraReasignadaFlujo: ['RS_AGE_COM_CRM_F_01', 'RS_AGE_COM_CRM_F_02'],
  /** `gest_cart_stock` (`RS_AGE_COM_CRM_S`), host `cra-v11`. */
  gestionCarteraStock: ['RS_AGE_COM_CRM_S_03', 'RS_AGE_COM_CRM_S_04'],
  /** `dat-prod-men` (`RS_DAT_PRO`), host `cra-v3`. */
  datosProducto: ['RS_DAT_PRO_01', 'RS_DAT_PRO_02', 'RS_DAT_PRO_03', 'RS_DAT_PRO_04'],
  /** `cont-elect-m` (`CONT_ELECT_M`), host `cra-v1p1`. */
  contratacionElectronica: ['CONT_ELECT_M_01', 'CONT_ELECT_M_02', 'CONT_ELECT_M_03'],
  /** `mon-efec-reasig` (`RS_MON_EFECREASIGM`), host `cra-v12`. */
  monitorEfectividadesReasignados: ['RS_MON_EFECREASIGM_01', 'RS_MON_EFECREASIGM_02'],
  /** `gest_cart_her` (`RS_AGE_COM_CRM`), host `cra-v11`. */
  gestionCarteraReasignadaMes: ['RS_AGE_COM_CRM_01', 'RS_AGE_COM_CRM_02'],
} as const;

/**
 * Programas del Gobierno (`pro-gob-m`, host `cra-v1p3`): cuatro bloques que se
 * distinguen por el `var` que lleva cada uno.
 */
export const BLOQUES_PROGRAMAS_GOBIERNO: readonly { codRep: string; var: number }[] = [
  { codRep: 'RPROGOB_M_01', var: 1 },
  { codRep: 'RPROGOB_M_02', var: 2 },
  { codRep: 'RPROGOB_M_03', var: 1 },
  { codRep: 'RPROGOB_M_04', var: 2 },
] as const;

/**
 * Monitor Efectividades (`mon-efec`, host `cra-v4`): dos bloques propios más el
 * mismo `_03` pedido dos veces, uno por tramo de mora.
 */
export const BLOQUES_MONITOR_EFECTIVIDADES: readonly { codRep: string; tram?: string }[] = [
  { codRep: 'RS_MON_EFECM_01' },
  { codRep: 'RS_MON_EFECM_02' },
  { codRep: 'RS_MON_EFECM_03', tram: '1. -30-0' },
  { codRep: 'RS_MON_EFECM_03', tram: '2. 1-30' },
] as const;

/** Reportes del motor `table.regular` (columnas dinámicas), legado `repositorio/*`. */
export const COD_MENSUAL_REPO = {
  /** Selector de cierre mensual, por defecto de `periodos()`. */
  periodos: 'RS_FECH',
  /** Tablero Digital Comercial. */
  tableroDigitalComercial: 'RS_TAB_COM_01',
  /**
   * Estructura de Desembolsos mensual — `desembolsos-m`. Usa la fecha elegida
   * en el filtro `RS_FECH`, a diferencia de la diaria (`RS_DESEMB_01`), que va
   * con la fecha de corte del usuario.
   */
  estructuraDesembolsos: 'RS_DESEMB_02',
  /** Cartera Agrícola · Cultivos. */
  carteraAgricola: 'RS_AGROMIX_01',
  /** CMG Cartera — tabla. Espera `codrel`/`Fecha`/`tipcod`. */
  cmgCarteraTabla: 'CMG_CARTERA_01',
  /** CMG Cartera — KPIs. Espera `cod_rel`/`fec`/`tipcod`. */
  cmgCarteraKpis: 'CMG_CARTERA_02',
} as const;

/** Estructura de Desembolsos mensual es más pesada que el resto: 3 min de techo. */
export const TIMEOUT_ESTRUCTURA_DESEMBOLSOS_MS = 180_000;

/**
 * Escala de la fila de distribución porcentual de Estructura de Desembolsos:
 * del menor valor (verde) al mayor (rojo). Con solo tres columnas se usan los
 * extremos y el centro.
 */
export const ESCALA_ESTRUCTURA_DESEMBOLSOS = [
  { bg: '#22c55e', text: '#ffffff' },
  { bg: '#84cc16', text: '#ffffff' },
  { bg: '#eab308', text: '#000000' },
  { bg: '#f97316', text: '#ffffff' },
  { bg: '#ef4444', text: '#ffffff' },
] as const;

/** La fila a colorear es la de distribución porcentual (`IDRango` 12 en el legado). */
export const ID_RANGO_DISTRIBUCION = 12;
