/** Fila de la tabla de detalle de bancarización. */
export interface FilaBancarizacion {
  nom: string;
  tf: number;
  gen: number;
  rur: number;
  mig: number;
}

/** Totales del detalle de bancarización. */
export interface TotalesBancarizacion {
  gen_c: number;
  rur_c: number;
  mig_c: number;
  tot_c: number;
  tot_m: number;
}

/** Objeto resultado completo del detalle de bancarización. */
export interface ResultadoBancarizacion {
  filas: FilaBancarizacion[];
  totales: TotalesBancarizacion | null;
}
