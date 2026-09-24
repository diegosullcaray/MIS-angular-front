import { aplicarEstilosEstructuraDesembolsos } from './estructura-desembolsos.util';

describe('aplicarEstilosEstructuraDesembolsos', () => {
  it('aplica la escala solo a la fila de distribución y marca los totales', () => {
    const resultado = aplicarEstilosEstructuraDesembolsos({
      columnas: [
        { key: '1_ope', label: 'Uno' }, { key: '2_ope', label: 'Dos' }, { key: '3_ope', label: 'Tres' },
      ],
      filas: [{ DES_RANGO: '% participación', '1_ope': 30, '2_ope': 10, '3_ope': 20 }, { DES_RANGO: 'Total' }],
    });

    const estilo = resultado.columnas[0].cellStyleFn?.(30, resultado.filas[0]);
    expect(estilo?.['font-weight']).toBe('bold');
    expect(resultado.filas[1]['style']).toBe(1);
  });

  it('deja intacta una tabla sin columnas', () => {
    const tabla = { filas: [] } as never;
    expect(aplicarEstilosEstructuraDesembolsos(tabla)).toBe(tabla);
  });
});
