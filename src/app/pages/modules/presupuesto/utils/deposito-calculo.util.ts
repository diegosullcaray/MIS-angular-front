import type { FilaDeposito } from '../models/deposito.model';

/** Fórmula de cascada de Depósitos BP/Red (`calculateRow` del legado) — idéntica para los 3 productos (Ahorros `a*`, CTS `b*`, Plazo Fijo `c*`): `Saldo Final = Saldo Inicial + Variación`, y el saldo de cierre pasa a ser el saldo inicial del periodo siguiente (arrastre). */
export function calcularFilaDeposito(filas: FilaDeposito[], idx: number): void {
  for (const prefijo of ['a', 'b', 'c'] as const) {
    const claveInicial = `${prefijo}1`;
    const claveVariacion = `${prefijo}2`;
    const claveFinal = `${prefijo}3`;

    const saldoInicial = Number(filas[idx][claveInicial] ?? 0);
    const variacion = Number(filas[idx][claveVariacion] ?? 0);
    const saldoFinal = saldoInicial + variacion;
    filas[idx][claveFinal] = saldoFinal;

    if (idx + 1 < filas.length) {
      filas[idx + 1][claveInicial] = saldoFinal;
    }
  }
}
