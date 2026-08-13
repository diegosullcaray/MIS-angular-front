/** Categoría del ranking Kaypacha. */
export interface CategoriaRanking {
  name: string;
  reportType: string;
  rdestip: string;
}

/** Fila del desglose de una categoría. */
export interface FilaDetalleRanking {
  ROWNUMBER: number;
  HCOLNOM: string;
  TOTAL_MES: number;
  hdester: string;
}

/** Detalle acumulado de una categoría con su fecha de actualización. */
export interface DetalleRanking {
  filas: FilaDetalleRanking[];
  fechaActualizacion: string | null;
}
