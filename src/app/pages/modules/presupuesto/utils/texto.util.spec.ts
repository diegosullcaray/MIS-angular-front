import { normalizarTexto } from './texto.util';

describe('normalizarTexto', () => {
  it('quita tildes y pasa a minúsculas', () => {
    expect(normalizarTexto('Línea')).toBe('linea');
    expect(normalizarTexto('Agencia San Isidro')).toBe('agencia san isidro');
  });

  it('permite comparar texto con y sin tilde como equivalente', () => {
    expect(normalizarTexto('línea').includes(normalizarTexto('linea'))).toBe(true);
  });

  it('no altera texto que ya no tiene diacríticos', () => {
    expect(normalizarTexto('sucursal piura')).toBe('sucursal piura');
  });
});
