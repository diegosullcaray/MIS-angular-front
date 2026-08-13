import { aplicarCascadaAsesores, calcularFilaCarteraCreditos, PRODUCTOS_COMPOSICION } from './cartera-creditos-calculo.util';
import type { FilaCarteraCreditosComposicion, FilaCarteraCreditosVariables } from '../models/cartera-creditos.model';

function filaVariables(overrides: Partial<FilaCarteraCreditosVariables> = {}): FilaCarteraCreditosVariables {
  return { ord: 1, a1: 0, a2: 0, a3: 0, b1: 0, b2: 0, b3: 0, b4: 0, b5: 0, b6: 0, c1: 0, c2: 0, ...overrides };
}

describe('aplicarCascadaAsesores()', () => {
  it('al editar "Asesores Nuevos" (b1), recalcula "Asesores en Producción" (b2) desde 2 periodos después', () => {
    const filas: FilaCarteraCreditosVariables[] = [
      filaVariables({ ord: 1, b1: 10, b2: 0 }),
      filaVariables({ ord: 2, b1: 0, b2: 5 }),
      filaVariables({ ord: 3 }),
      filaVariables({ ord: 4 }),
    ];

    const inicio = aplicarCascadaAsesores(filas, 0, 'b1');

    // b2[2] = b1[0] + b2[1] = 10 + 5 = 15; b2[3] = b1[1] + b2[2] = 0 + 15 = 15
    expect(filas[2].b2).toBe(15);
    expect(filas[3].b2).toBe(15);
    expect(inicio).toBe(2);
  });

  it('al editar "Asesores en Producción" (b2) directo, recalcula desde el periodo siguiente', () => {
    const filas: FilaCarteraCreditosVariables[] = [
      filaVariables({ ord: 1, b1: 10, b2: 20 }),
      filaVariables({ ord: 2 }),
      filaVariables({ ord: 3 }),
    ];

    const inicio = aplicarCascadaAsesores(filas, 0, 'b2');

    // b2[1] = b1[-1](undefined→0) + b2[0] = 0 + 20 = 20; b2[2] = b1[0] + b2[1] = 10 + 20 = 30
    expect(filas[1].b2).toBe(20);
    expect(filas[2].b2).toBe(30);
    expect(inicio).toBe(0);
  });

  it('para cualquier otra columna, no toca b2 y la cascada principal arranca en la misma fila editada', () => {
    const filas: FilaCarteraCreditosVariables[] = [filaVariables({ ord: 1, b2: 7 }), filaVariables({ ord: 2 })];

    const inicio = aplicarCascadaAsesores(filas, 0, 'b3');

    expect(filas[1].b2).toBe(0);
    expect(inicio).toBe(0);
  });
});

describe('calcularFilaCarteraCreditos()', () => {
  it('calcula Operaciones Desembolsadas (b4) truncando asesores × productividad', () => {
    const variables: FilaCarteraCreditosVariables[] = [filaVariables({ b2: 3, b3: 2.7 })];
    calcularFilaCarteraCreditos(variables, [], 0);
    expect(variables[0].b4).toBe(Math.floor(3 * 2.7)); // 8
  });

  it('calcula Monto Desembolsado (b6) = ticket promedio × operaciones desembolsadas', () => {
    const variables: FilaCarteraCreditosVariables[] = [filaVariables({ b2: 2, b3: 3, b5: 100 })];
    calcularFilaCarteraCreditos(variables, [], 0);
    expect(variables[0].b4).toBe(6);
    expect(variables[0].b6).toBe(600);
  });

  it('calcula Monto Cancelado (c2) = saldo inicial × ratio de cancelación', () => {
    const variables: FilaCarteraCreditosVariables[] = [filaVariables({ c1: 0.1, a1: 1000 })];
    calcularFilaCarteraCreditos(variables, [], 0);
    expect(variables[0].c2).toBe(100);
  });

  it('calcula Saldo Cierre (a3) = saldo inicial + desembolsado - cancelado - castigado, y arrastra al periodo siguiente', () => {
    const variables: FilaCarteraCreditosVariables[] = [
      filaVariables({ ord: 1, b2: 2, b3: 5, b5: 100, c1: 0.1, a1: 1000, a2: 50 }), // desembolso=10*100=1000, cancelado=1000*0.1=100
      filaVariables({ ord: 2 }),
    ];

    calcularFilaCarteraCreditos(variables, [], 0);

    // saldo_fin = 1000 (ini) + 1000 (desembolso) - 100 (cancelado) - 50 (castigado) = 1850
    expect(variables[0].a3).toBe(1850);
    expect(variables[1].a1).toBe(1850); // arrastre al siguiente periodo
  });

  it('no intenta arrastrar el saldo si es la última fila', () => {
    const variables: FilaCarteraCreditosVariables[] = [filaVariables({ a1: 100 })];
    expect(() => calcularFilaCarteraCreditos(variables, [], 0)).not.toThrow();
  });

  it('actualiza la composición por producto (d_<id> = ratio g_<id> × monto desembolsado) para los 11 productos', () => {
    const variables: FilaCarteraCreditosVariables[] = [filaVariables({ b2: 1, b3: 1, b5: 100 })]; // monDes = 100
    const composicion: FilaCarteraCreditosComposicion[] = [{ ord: 1 }];
    for (const producto of PRODUCTOS_COMPOSICION) {
      composicion[0][`g_${producto.id}`] = 0.1;
    }

    calcularFilaCarteraCreditos(variables, composicion, 0);

    for (const producto of PRODUCTOS_COMPOSICION) {
      expect(composicion[0][`d_${producto.id}`]).toBeCloseTo(10); // 0.1 * 100
    }
  });

  it('no falla si no hay fila de composición para ese índice (tabs de composición aún sin cargar)', () => {
    const variables: FilaCarteraCreditosVariables[] = [filaVariables({ a1: 100 })];
    expect(() => calcularFilaCarteraCreditos(variables, [], 0)).not.toThrow();
  });
});
