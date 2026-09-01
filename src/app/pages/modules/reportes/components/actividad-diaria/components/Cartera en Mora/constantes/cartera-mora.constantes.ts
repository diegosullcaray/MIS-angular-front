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

/**
 * `repositorio/cero-cuotas` — "Dashboard en Revisión". Va por `table.regular`
 * con `fecha` (con guiones), no por el motor "mixto".
 */
export const COD_DASHBOARD_REVISION = ['REP_CERCUOT_01', 'REP_CERCUOT_02'] as const;

/** Una serie del Dashboard en Revisión: el legado la lee por POSICIÓN de columna. */
export interface SerieDashboardRevision {
  readonly nombre: string;
  readonly columna: number;
  readonly color: string;
}

/** Un gráfico del Dashboard en Revisión, con el bloque del que salen sus filas. */
export interface GraficoDashboardRevision {
  readonly titulo: string;
  /** Índice dentro de `COD_DASHBOARD_REVISION`. */
  readonly bloque: 0 | 1;
  readonly series: readonly SerieDashboardRevision[];
  /** Los saldos se dividen entre 1.000.000, igual que el `parseMM()` del legado. */
  readonly enMillones?: boolean;
}

/**
 * Los cuatro gráficos del Dashboard en Revisión.
 *
 * Las columnas van por índice porque el `data` de estos bloques no trae claves
 * estables: el legado también las lee con `Object.values(row)[n]`.
 */
export const GRAFICOS_DASHBOARD_REVISION: readonly GraficoDashboardRevision[] = [
  {
    titulo: 'Cero Cuotas Nuevo Ingreso (N°)',
    bloque: 0,
    series: [
      { nombre: 'Total Nro', columna: 4, color: '#a6a6a6' },
      { nombre: 'Nuevo Ingreso', columna: 2, color: '#4472c4' },
      { nombre: 'Mantiene', columna: 6, color: '#ffc000' },
    ],
  },
  {
    titulo: 'Cero Cuotas Nuevo Ingreso (S/MM)',
    bloque: 0,
    enMillones: true,
    series: [
      { nombre: 'Total Saldo', columna: 5, color: '#a6a6a6' },
      { nombre: 'Nuevo Ingreso', columna: 3, color: '#4472c4' },
      { nombre: 'Mantiene', columna: 7, color: '#ffc000' },
    ],
  },
  {
    titulo: 'Nuevo Ingreso x Tramos de Atraso (N°)',
    bloque: 1,
    series: [
      { nombre: '1. <=8 días', columna: 2, color: '#4472c4' },
      { nombre: '2. <9 - 15 días', columna: 4, color: '#00b0f0' },
      { nombre: '3. <16 - 30 días', columna: 6, color: '#ffc000' },
      { nombre: '4. >31 días', columna: 8, color: '#e53935' },
    ],
  },
  {
    titulo: 'Nuevo Ingreso x Tramos de Atraso (S/MM)',
    bloque: 1,
    enMillones: true,
    series: [
      { nombre: '1. <=8 días', columna: 3, color: '#4472c4' },
      { nombre: '2. <9 - 15 días', columna: 5, color: '#00b0f0' },
      { nombre: '3. <16 - 30 días', columna: 7, color: '#ffc000' },
      { nombre: '4. >31 días', columna: 9, color: '#e53935' },
    ],
  },
];
