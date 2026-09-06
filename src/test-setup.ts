import { beforeEach } from 'vitest';

/**
 * El caché de jerarquía persiste en `sessionStorage`, y en jsdom ese almacén se
 * comparte entre archivos de spec del mismo worker: sin vaciarlo, un spec le
 * sirve a otro un árbol ya resuelto y el segundo nunca llama al backend que
 * dobló (o llama a uno que no dobló). Se vacía antes de cada test.
 */
beforeEach(() => {
  try {
    sessionStorage.clear();
  } catch {
    // Sin storage disponible no hay nada que aislar.
  }
});
