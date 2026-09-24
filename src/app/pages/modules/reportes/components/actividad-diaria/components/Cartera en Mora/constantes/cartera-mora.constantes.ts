/**
 * Códigos de reporte (`cod_rep`) de Cartera en Mora y Cero Cuotas Nuevas.
 *
 * El comentario de cada clave nombra la ruta del legado y, cuando importa, el
 * host `cra-*` del que cuelga: es lo que decide el strand y el nombre del corte.
 */

/** Reportes de Cartera en Mora (todos con jerarquía `UNI_1`). */
export const COD_CARTERA_MORA = {
  /** `cmg-mora`. */
  cmgMora: 'cuadro_Variable_Riesgo_01',
  /** `cmg-mora-simp`. */
  cmgMoraSinImpulso: 'cmg_mora_simp_01',
  /** `mon-efec`, host `cra-v4` — resumen. */
  monitorEfectividadesResumen: 'RS_MON_EFEC_01',
  /** `mon-efec`, host `cra-v4` — detalle paginado, con filtros propios. */
  monitorEfectividadesDetalle: 'RS_MON_EFEC_02',
  /** `mon-efec`, host `cra-v4` — gestiones ingresadas, se pide una vez por tramo. */
  monitorEfectividadesTramo: 'RS_MON_EFEC_03',
  /** Opciones de "Última Gestión", que el legado trae del propio backend. */
  opcionesUltimaGestion: 'SEL_EFEC_01',
  /** `mon-efecrepro`, host `cra-v7`. */
  seguimientoReprogramados: 'RS_MON_EFECREPRO_01',
  /** `mon-efectramoscomer`, host `cra-v7`. */
  reportePagoPuntual: 'RS_MON_EFECTRAMOSC_01',
  /** `mon-efec-sinasig`, host paginado `cra-V10`. */
  efectividadesSinAsignar: 'RMESA_01',
  /**
   * `top-efec`. El id del mapa es `'01'` SIN guion bajo: el código es
   * `RSRTOPV01`, no `RSRTOPV_01`.
   */
  topVariablesRiesgo: 'RSRTOPV01',
  /** `ava-port` — un solo bloque pedido tres veces, una por `mode`. */
  seguimientoPortafolio: 'RS_AVA_POR_01',
} as const;

/** Reportes de dos bloques con el mismo prefijo: se piden `_01` y `_02`. */
export const COD_CARTERA_MORA_PAREJAS = {
  /** `cal-cart` — los dos bloques piden `fecha`. */
  calidadCartera: ['RS_CAL_CAR_01', 'RS_CAL_CAR_02'],
  /** `port-sup` — sin parámetros propios. */
  portafoliosSupervision: ['PORTSUPE_01', 'PORTSUPE_02'],
  /** `zu-cuo` — sin parámetros propios. */
  ceroUnaCuota: ['CEROYCUOTA_01', 'CEROYCUOTA_02'],
} as const;

/** Los dos tramos de mora por los que se pide el bloque de gestiones ingresadas. */
export const TRAMOS_MONITOR_EFECTIVIDADES = ['1. -30-0', '2. 1-30'] as const;

/** Top Variables de Riesgo: el mismo bloque por grupo, corredores y unidades. */
export const CORTES_TOP_VARIABLES = [
  { tip_cod2: '7', level: '2' },
  { tip_cod2: '20', level: '1' },
  { tip_cod2: '18', level: '1' },
] as const;

/** Seguimiento de Portafolio: 1 potencial ingreso a mora, 2 por grupo, 3 cuota ballon. */
export const MODOS_SEGUIMIENTO_PORTAFOLIO = [1, 2, 3] as const;

/** Reportes de Cero Cuotas Nuevas. */
export const COD_CERO_CUOTAS = {
  /**
   * `graf-dashboard`. Su entrada del mapa no declara `reportType` y su bloque
   * está en `graphic`: va por `graphicData` y devuelve gráficos, no una tabla.
   */
  dashboard: 'rda/administracion/mora/Dashboard_rda_01',
  /** `cmd-cerocuotanueva` — dos bloques que comparten los filtros `prod` y `tipcuota`. */
  cuadroMando: ['CMCUONUEV_01', 'CMCUONUEV_02'],
  /** `Top-CeroCuota` — cinco bloques, cada uno pedido por sus dos cortes. */
  top: [
    'CEROCUOTA_TOPCNUEVA_01',
    'CEROCUOTA_TOPCNUEVA_02',
    'CEROCUOTA_TOPCNUEVA_03',
    'CEROCUOTA_TOPCNUEVA_04',
    'CEROCUOTA_TOPCNUEVA_05',
  ],
} as const;

/**
 * Los dos cortes por los que "Top" pide cada bloque (legado `tip_cod2`), en el
 * orden intercalado en que el legado los apila en pantalla.
 */
export const CORTES_TOP_CERO_CUOTAS = [
  { tip_cod2: '20', etiqueta: 'Territorio' },
  { tip_cod2: '18', etiqueta: 'Unidad' },
] as const;

/** `list-cero-cuotas`, host paginado `cra-V10`, con su filtro `tipcuota`. */
export const COD_BASE_GESTION = 'LCCUOTANUEVA_01';
