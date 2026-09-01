/**
 * Códigos de reporte (`cod_rep`) y parámetros fijos del módulo Cartera.
 *
 * Viven acá y no en los services para que estos queden con lo único que les
 * toca: armar la petición. Cada constante nombra el reporte del legado del que
 * salió, que es el dato que hace falta para rastrearlo.
 */

/** Reportes del motor "mixto" (`regularData`), hosts `cra-*`. */
export const COD_CARTERA_CRA = {
  /** `port-agro`. */
  portafolioAgro: 'PortafolioAgro_01',
  /** `des-cred`. */
  destinoCredito: 'DESCRED_01',
  /** `com-cre`. */
  comiteCreditos: 'GCOMCRE_02',
  /** `rep-aut-tas-diaria`. */
  rankingAutonomias: 'reporte_autonomia_newdiaria_01',
  /** `ract-gp` — activas PDM. */
  activasPdm: 'RACTGP_01',
  /** `resmora-gp` — mora PDM. */
  moraPdm: 'RESMORAGP_01',
  /** `resinc-grup` — detalle de incentivos PDM, paginado. */
  detalleIncentivosPdm: 'RESINCGRUP_01',
  /** `det-incen-pdm` — desembolsos PDM, paginado y con el corte como `fecha`. */
  desembolsosPdm: 'DET_INCEN_PDM_01',
} as const;

/** Reportes de varios bloques, en el orden en que el legado los pinta. */
export const COD_CARTERA_CRA_MULTIBLOQUE = {
  /** `sal-car` — el `_04` y el `_05` van primero. Todos piden `fecha`. */
  saldoCartera: ['RS_SAL_CAR_04', 'RS_SAL_CAR_05', 'RS_SAL_CAR_01', 'RS_SAL_CAR_02', 'RS_SAL_CAR_03'],
  /** `dat-pro` — todos piden `fecha`. */
  datosProducto: ['RS_DAT_PRO_01', 'RS_DAT_PRO_02', 'RS_DAT_PRO_03', 'RS_DAT_PRO_04'],
  /** `desem-diario` — cinco bloques sin filtros propios. */
  desembolsosDiarios: ['DesemDiario_01', 'DesemDiario_02', 'DesemDiario_03', 'DesemDiario_04', 'DesemDiario_05'],
} as const;

/**
 * Autonomía de Tasas (`gst-activas`): un bloque por variable, y el orden NO es
 * el numérico — el legado pinta la 10 antes que la 9. El `var` de cada petición
 * es el mismo número que va en el código, con dos dígitos.
 */
export const VARIABLES_AUTONOMIA_TASAS = [1, 2, 3, 4, 5, 6, 7, 8, 10, 9] as const;

/** Reportes del motor `table.regular` (columnas dinámicas), legado `repositorio/*`. */
export const COD_CARTERA_REPO = {
  /** Estructura de Desembolsos — `repositorio/desembolsos`. */
  estructuraDesembolsos: 'RS_DESEMB_01',
  /** Cartera Agrícola · Cultivos — `repositorio/agro-mix-d`. */
  carteraAgricola: 'RS_AGROMIX_01',
  /** Gestión Comercial — tabla principal y origen de los KPIs (su fila 0 es el total). */
  gestionComercial: 'RS_GEST_COM_01',
  /** Gestión Comercial — tabla "Var Saldo Cartera Vigente". */
  gestionComercialVarSaldo: 'RS_GEST_COM_02',
  /** Gestión Comercial — tabla "Var Clientes Stock". */
  gestionComercialVarClientes: 'RS_GEST_COM_03',
  /** CMG Cartera — tabla. Ojo: espera `codrel`/`Fecha`/`tipcod`, no `cod_rel`/`fec`. */
  cmgCarteraTabla: 'CMG_CARTERA_01',
  /** CMG Cartera — KPIs. Espera `cod_rel`/`fec`/`tipcod`. */
  cmgCarteraKpis: 'CMG_CARTERA_02',
  /** Ranking Comercial — `repositorio/ranking-comercial`. */
  rankingComercial: 'RS_RANK_COM_01',
  /** Monitor de Inteligencia de Negocios — `repositorio/mon-int-comer`. */
  monitorInteligencia: 'RS_MON_INT_COM_01',
  /** Selector de periodo de Gestión Comercial (`loadFilter()` del legado). */
  periodosGestionComercial: 'RS_FECH02',
} as const;

/** Las tres tablas de Gestión Comercial, en el orden en que las consume el service. */
export const TABLAS_GESTION_COMERCIAL = [
  COD_CARTERA_REPO.gestionComercial,
  COD_CARTERA_REPO.gestionComercialVarSaldo,
  COD_CARTERA_REPO.gestionComercialVarClientes,
] as const;

/**
 * Ranking Comercial no usa la jerarquía: el legado manda territorio y corredor
 * en `'0'` fijo, trae el ranking completo y filtra del lado del cliente.
 */
export const PARAMS_RANKING_COMERCIAL = { territorio: '0', corredor: '0' } as const;

/**
 * Semáforos de CMG Cartera: columna visible → columna de control.
 *
 * El legado antepone un ícono coloreado a las columnas 9/11/13 según el signo
 * de las columnas 8/10/12, que llegan ocultas (`cellStyle.display: 'none'`).
 */
export const SEMAFOROS_CMG_CARTERA: Readonly<Record<string, string>> = {
  '9': '8',
  '11': '10',
  '13': '12',
};

/** Ranking Comercial: clave de avance del legado → columna de semáforo calculada. */
export const AVANCES_RANKING_COMERCIAL: readonly (readonly [origen: string, destino: string])[] = [
  ['Percent_Cumpl', 'Percent_Cumpl_Semaforo'],
  ['percent_cumpl_desemb', 'percent_cumpl_desemb_Semaforo'],
  ['percent_cumpl_varsalv', 'percent_cumpl_varsalv_Semaforo'],
] as const;

/** Filas de índice fijo de las que CMG Cartera saca sus tarjetas, igual que el legado. */
export const FILAS_TARJETAS_CMG = { tapp: 16, saldoMedio: 18 } as const;
