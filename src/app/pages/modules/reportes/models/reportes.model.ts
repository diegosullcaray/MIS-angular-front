/**
 * Nodo del árbol jerárquico organizativo (`base_hier`/`level_hier` del backend
 * Ant, módulo `admin` — ver `ModSysAdminService`). Mismo campo `desc_rel`
 * (prefijo `desc_`, no `des_`) que usa Presupuesto para el mismo endpoint —
 * ver `presupuesto.model.ts`.
 */
export interface HierarquiaNodo {
  tip_cod: number;
  cod_rel: string;
  desc_rel: string;
  lvl?: number;
}

/** Parámetros del selector de jerarquía organizativa — `getHierarchyConfig('UNI_1')` del legado (`reportes/compartido/servicios/mod-rep.service.ts`). */
export interface ParamsJerarquia {
  /** `cod_jer` — código de la jerarquía organizativa a explorar (9 = jerarquía UNI_1, la misma que usan Presupuesto/Kaypacha/Incentivos). */
  code: number;
  /** Profundidad máxima de niveles que puede expandir el usuario. */
  maxLvl: number;
  /** Título del diálogo del selector. */
  dlgTitulo: string;
}

/**
 * Tipos de formato de celda soportados por `TablaReporteComponent` — subconjunto
 * del motor legado (`table-multiheader`/`TableMHService`) que cubre los
 * reportes migrados hasta ahora. El legado también soportaba `variation`/`ratio`
 * (deltas calculados entre dos campos) y celdas interactivas `button`/`checkbox`/
 * `radio` (solo bajo `theme.edit === true`) — ninguno de los reportes migrados
 * los usa todavía (`theme_tb1()` fija `edit: false`), así que no se migran por
 * ahora; agregar un tipo nuevo a `FormatoColumnaReporte` cuando haga falta.
 */
export type FormatoColumnaReporte = 'string' | 'number' | 'percent' | 'date' | 'traffic-light';

/** Columna (o celda de agrupación) de un encabezado de reporte — `result.headers[n].columns[m]` del backend. */
export interface ColumnaReporte {
  columnDef: string;
  header: string;
  /** `colspan` — cuántas columnas de datos agrupa esta celda de encabezado. */
  cols?: number;
  /** `rowspan` — cuántas filas de encabezado ocupa esta celda. */
  rows?: number;
  /**
   * Orden de la columna de datos dentro de la fila del cuerpo (presente solo
   * en columnas "hoja" — las celdas de agrupación de encabezado no traen este
   * campo). `TablaReporteComponent` ordena y filtra por este campo para saber
   * qué columnas pintar en el cuerpo de la tabla.
   */
  isdata?: number;
  format?: { type: FormatoColumnaReporte; unit?: string };
  style?: { background?: string; width?: string };
}

/** Una fila de encabezado — el backend puede devolver varias (encabezados agrupados con colspan/rowspan). */
export interface FilaEncabezadoReporte {
  columns: ColumnaReporte[];
}

/** Fila del cuerpo de la tabla — claves dinámicas según `columnDef`. */
export type FilaReporte = Record<string, unknown>;

/** Resultado crudo de un bloque del motor de reportes "mixtos" (`result` del backend, ver `ModReportesService.getRegularData`). */
export interface TablaReporteResultado {
  headers: FilaEncabezadoReporte[];
  body: FilaReporte[];
  /** Mapa plano usado por los bloques tipo "tarjeta KPI" (ver `KpiOperacionesDesembolsadas`/`KpiMontoDesembolsado`). */
  additional?: Record<string, unknown>;
}

/**
 * Datos de la tarjeta KPI "Operaciones Desembolsadas" (bloque `Monitor_Dese_01`
 * de Monitor Metas Desembolso) — igual `additional` que sustituía los
 * placeholders `:$fecha`/`:$hora`/`:$cumpl_des_acum`/`:$style_cumpl_des_acum`
 * del HTML crudo en el legado (`cra-map.ts`).
 *
 * `style_cumpl_des_acum` gap conocido: en el legado era literalmente un
 * nombre de clase CSS interpolado en el `class` del elemento — no hay forma
 * de confirmar el valor exacto que devuelve el backend sin acceso a él en
 * vivo, y las clases CSS del legado (Angular Material/Bootstrap) no existen
 * en este Host (Tailwind + tokens `--mis-*`). Por ahora se ignora ese campo
 * y la tarjeta se muestra sin codificación de color — retomar cuando se
 * pueda confirmar el contrato real del backend.
 */
export interface KpiOperacionesDesembolsadas {
  fecha: string;
  hora: string;
  cumpl_des_acum: string;
  style_cumpl_des_acum?: string;
}

/** Datos de la tarjeta KPI "Monto Desembolsado" (bloque `Monitor_Dese_02`) — mismo gap de `style_cumpl_ope_acum` que `KpiOperacionesDesembolsadas`. */
export interface KpiMontoDesembolsado {
  cumpl_ope_acum: string;
  style_cumpl_ope_acum?: string;
}

/** Opción del filtro "Tipo" de Monitor Reprogramados (`GCOVID_OPT01()` del legado, variable `car`). */
export interface OpcionTipoReprogramados {
  id: 1 | 2;
  desc: string;
}

export const OPCIONES_TIPO_MON_REP: OpcionTipoReprogramados[] = [
  { id: 1, desc: 'Operaciones' },
  { id: 2, desc: 'Saldo' },
];
