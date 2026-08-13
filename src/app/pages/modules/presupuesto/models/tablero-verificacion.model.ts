/** Fila de la tabla de Tablero de Verificación. */
export interface LogVerificacionFila {
  des_rel: string;
  /** Estado de verificación: 1 = verificado (verde), cualquier otro valor = pendiente (rojo). */
  cod_est: number;
  usu_log: string;
  tim_log: string;
  [key: string]: unknown;
}
