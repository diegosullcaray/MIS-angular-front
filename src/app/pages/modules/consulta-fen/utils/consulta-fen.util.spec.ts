import { describe, expect, it } from 'vitest';
import { esFilaRiesgoFen, esRiesgoAlto, mapearFilasFen, puntoReferencialUbigeo, puntosCalorFen } from './consulta-fen.util';

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

  it('ubica el departamento del UBIGEO sin inventar precisión distrital', () => {
    expect(puntoReferencialUbigeo('040101')).toEqual({ lat: -16.3989, lng: -71.535, precision: 'departamento' });
    expect(puntoReferencialUbigeo('990101')).toBeNull();
  });

  it('pondera el riesgo predominante para el mapa de calor', () => {
    expect(puntosCalorFen([FILA])).toEqual([
      expect.objectContaining({ ubigeo: '040101', nivel: 'Alto', intensidad: 0.8, precision: 'departamento' }),
    ]);
  });
});
