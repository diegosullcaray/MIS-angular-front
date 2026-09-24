import { aplanarEncabezados } from './tabla-dinamica.util';

describe('aplanarEncabezados', () => {
  it('calcula spans y hojas para un árbol de cabeceras', () => {
    const resultado = aplanarEncabezados([
      { label: 'Producto', key: 'producto' },
      { label: 'Montos', key: 'montos', subs: [{ label: 'Actual', key: 'actual' }, { label: 'Meta', key: 'meta' }] },
    ]);

    expect(resultado.filas).toHaveLength(2);
    expect(resultado.filas[0][0].rowspan).toBe(2);
    expect(resultado.filas[0][1].colspan).toBe(2);
    expect(resultado.columnasHoja.map((columna) => columna.key)).toEqual(['producto', 'actual', 'meta']);
  });

  it('acepta una tabla sin columnas', () => {
    expect(aplanarEncabezados([])).toEqual({ filas: [], columnasHoja: [] });
  });
});
