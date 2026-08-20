/** Fila de la tabla de Responsables — `cod_res` es la única columna editable. Firma de índice: para que `EditableTableComponent<T extends FilaTabla>` la acepte. */
export interface ResponsableFila {
  des_rel: string;
  cod_res: string;
  usu_log: string;
  tim_log: string;
  [key: string]: unknown;
}

/** Nivel jerárquico fijo del selector de Responsables (no usa árbol, son 6 niveles hardcodeados). */
export interface NivelJerarquiaFijo {
  tip_cod: number;
  des_lvl: string;
}
