/**
 * Códigos de reporte (`cod_rep`) y parámetros fijos del módulo Cartera.
 *
 * Viven acá y no en los services para que estos queden con lo único que les
 * toca: armar la petición. Cada constante nombra el reporte del legado del que
 * salió, que es el dato que hace falta para rastrearlo.
 */

/** Reportes del motor "mixto" (`regularData`), host `cra-*`. */
export const COD_CARTERA_CRA = {
  /** Resumen de Cartera por Grupo. */
  resumenGrupo: 'RESINCGRUP_01',
  /** Resumen de Mora por Grupo. */
  resumenMoraGrupo: 'RESMORAGP_01',
  /** Reporte de Actividad Grupal. */
  actividadGrupal: 'RACTGP_01',
  /** Detalle de Incentivos PDM. */
  detalleIncentivosPdm: 'DET_INCEN_PDM_01',
  /** Descuentos de crédito. */
  descuentosCredito: 'DESCRED_01',
  /** Gestión Comercial de Créditos. */
  gestionComercialCreditos: 'GCOMCRE_02',
  /** Datos del prospecto. */
  datosProspecto: 'RS_DAT_PRO',
  /** Saldo de cartera. */
  saldoCartera: 'RS_SAL_CAR',
} as const;

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
