/** El legado usa estas columnas ocultas para los semáforos visibles de CMG Cartera. */
export const SEMAFOROS_CMG_CARTERA: Readonly<Record<string, string>> = {
  '9': '8',
  '11': '10',
  '13': '12',
};

/** Filas de índice fijo usadas por las tarjetas CMG diaria y mensual. */
export const FILAS_TARJETAS_CMG = { tapp: 16, saldoMedio: 18 } as const;
