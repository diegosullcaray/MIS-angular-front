import { formatearNumero, formatearPorcentaje } from './formato.util';

describe('formato', () => {
  it('formatea cifras con locale peruano y decimales máximos', () => {
    expect(formatearNumero(1234.567, 2)).toBe('1,234.57');
    expect(formatearNumero(1234.5, 0)).toBe('1,235');
  });

  it('convierte fracciones a porcentajes', () => {
    expect(formatearPorcentaje(0.1234)).toBe('12.34%');
  });
});
