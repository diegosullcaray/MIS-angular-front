import { SEMAFOROS_TABLERO_COMERCIAL } from '../models/tablero-comercial.model';

type Semaforo = -1 | 0 | 1;

const aNumero = (valor: unknown): number | null => {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  return Number.isNaN(numero) ? null : numero;
};

/** `colorFn` del legado: verde si la variación no es negativa; rojo si baja o falta. */
export function semaforoVariacion(valor: unknown): Semaforo {
  const numero = aNumero(valor);
  return numero !== null && numero >= 0 ? 1 : -1;
}

/** `tlFn` del legado: verde desde el 100 %, ámbar desde el 80 %, rojo debajo o sin dato. */
export function semaforoCumplimiento(valor: unknown): Semaforo {
  const numero = aNumero(valor);
  if (numero === null) return -1;
  if (numero >= 1) return 1;
  if (numero >= 0.8) return 0;
  return -1;
}

/** Agrega a cada fila los semáforos que el legado calcula en el cliente. */
export function semaforosTableroComercial(filas: readonly Record<string, unknown>[]): Record<string, unknown>[] {
  return filas.map((fila) => ({
    ...fila,
    [SEMAFOROS_TABLERO_COMERCIAL.var_enro]: semaforoVariacion(fila['var_enro']),
    [SEMAFOROS_TABLERO_COMERCIAL.cumplUsa]: semaforoCumplimiento(fila['cumplUsa']),
    [SEMAFOROS_TABLERO_COMERCIAL.cumplUsaCar]: semaforoCumplimiento(fila['cumplUsaCar']),
  }));
}
