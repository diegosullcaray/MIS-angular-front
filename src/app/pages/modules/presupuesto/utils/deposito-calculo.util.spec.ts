import { calcularFilaDeposito } from './deposito-calculo.util';
import type { FilaDeposito } from '../models';

function filaDeposito(overrides: Partial<FilaDeposito> = {}): FilaDeposito {
  return { ord: 1, a1: 0, a2: 0, a3: 0, b1: 0, b2: 0, b3: 0, c1: 0, c2: 0, c3: 0, ...overrides };
}

describe('calcularFilaDeposito()', () => {
  it('Saldo Final = Saldo Inicial + Variación, para los 3 productos (Ahorros/CTS/Plazo Fijo)', () => {
    const filas: FilaDeposito[] = [filaDeposito({ a1: 100, a2: 20, b1: 50, b2: -10, c1: 200, c2: 0 })];

    calcularFilaDeposito(filas, 0);

    expect(filas[0].a3).toBe(120);
    expect(filas[0].b3).toBe(40);
    expect(filas[0].c3).toBe(200);
  });

  it('el saldo de cierre pasa a ser el saldo inicial del periodo siguiente (arrastre)', () => {
    const filas: FilaDeposito[] = [
      filaDeposito({ ord: 1, a1: 100, a2: 20, b1: 50, b2: -10, c1: 200, c2: 0 }),
      filaDeposito({ ord: 2, a2: 5, b2: 5, c2: 10 }),
    ];

    calcularFilaDeposito(filas, 0);

    expect(filas[1].a1).toBe(120);
    expect(filas[1].b1).toBe(40);
    expect(filas[1].c1).toBe(200);
  });

  it('no intenta arrastrar el saldo si es la última fila', () => {
    const filas: FilaDeposito[] = [filaDeposito({ a1: 100, a2: 20 })];

    expect(() => calcularFilaDeposito(filas, 0)).not.toThrow();
  });

  it('trata valores nulos/indefinidos como 0', () => {
    // Fila deliberadamente incompleta — prueba el fallback defensivo de la fórmula
    // (`Number(x ?? 0)`) ante datos reales que puedan venir parciales del backend.
    const filas = [{ ord: 1 }] as FilaDeposito[];

    calcularFilaDeposito(filas, 0);

    expect(filas[0].a3).toBe(0);
    expect(filas[0].b3).toBe(0);
    expect(filas[0].c3).toBe(0);
  });
});
