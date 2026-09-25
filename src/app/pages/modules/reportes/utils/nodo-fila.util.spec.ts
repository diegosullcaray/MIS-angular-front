import { nodoDeFila } from './nodo-fila.util';

describe('nodoDeFila', () => {
  it('arma el nodo con htipcod + cod_rel', () => {
    expect(nodoDeFila({ htipcod: 18, cod_rel: 'AG-1', descripcion: 'Agencia Centro' })).toEqual({
      tip_cod: 18,
      cod_rel: 'AG-1',
      des_rel: 'Agencia Centro',
    });
  });

  it('acepta hcodrel y htipcod como texto', () => {
    expect(nodoDeFila({ htipcod: '18', hcodrel: 'A-01', descripcion: 'Agencia' })).toEqual({
      tip_cod: 18,
      cod_rel: 'A-01',
      des_rel: 'Agencia',
    });
  });

  it('devuelve null si la fila no trae un nodo completo', () => {
    expect(nodoDeFila({ descripcion: 'Total', style: 1 })).toBeNull();
    expect(nodoDeFila({ htipcod: 18, cod_rel: '' })).toBeNull();
    expect(nodoDeFila({ cod_rel: 'AG-1' })).toBeNull();
  });

  it('toma el nombre de la columna de etiqueta indicada', () => {
    expect(nodoDeFila({ htipcod: 18, cod_rel: 'AG-1', DESUNI: 'Agencia Norte' }, 'DESUNI')?.des_rel).toBe('Agencia Norte');
  });
});
