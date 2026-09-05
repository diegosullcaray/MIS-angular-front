/** Códigos de reporte (`cod_rep`) de Clientes. */
export const COD_CLIENTES = {
  /** `cli-nuevo-rec`. */
  nuevosRecurrentes: 'Clientes_nuevoRec_01',
  /** `cli-ope`. */
  operaciones: 'Clientes_Ope_01',
  /** `cmg-cli-flujo`. */
  cmgFlujo: 'CMG_CLIF_01',
  /** `cmg-cli` — strand deprecado (`reportData`). */
  cmgStock: 'rda/administracion/clientes/cmg_cliente_01',
  /** `mov-cli` — no manda parámetros: trae el movimiento completo. */
  movimientoClientes: 'MOVIMIENTO_CLIENTES_01',
  /** `rank-muj` — dos bloques con los mismos parámetros. */
  rankingMujer: ['RS_RANK_MUJ_01', 'RS_RANK_MUJ_02'],
} as const;
