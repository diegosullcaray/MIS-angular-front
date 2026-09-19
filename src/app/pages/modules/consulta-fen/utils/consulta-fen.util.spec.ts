import { esFilaRiesgoFen, esRiesgoAlto, mapearFilasFen } from './consulta-fen.util';

const FILA = {
  cod_ubi: '040101', des_dep: 'AREQUIPA', des_prov: 'AREQUIPA', des_dist: 'AREQUIPA',
  exp_mas: 'Muy Bajo', exp_inu: 'Medio', exp_seq: 'Medio', exp_pre: 'Alto',
} as const;

describe('utilidades de Consulta FEN', () => {
  it('valida el contrato y conserva el UBIGEO como texto', () => {
    expect(esFilaRiesgoFen(FILA)).toBe(true);
    expect(esFilaRiesgoFen({ ...FILA, cod_ubi: 40101 })).toBe(false);
    expect(mapearFilasFen([FILA])).toEqual([FILA]);
    expect(mapearFilasFen([{ ...FILA, exp_pre: 'Desconocido' }])).toBeNull();
  });

  it('reconoce riesgos comerciales altos', () => {
    expect(esRiesgoAlto('Alto')).toBe(true);
    expect(esRiesgoAlto('Muy Alto')).toBe(true);
    expect(esRiesgoAlto('Medio')).toBe(false);
  });

});
