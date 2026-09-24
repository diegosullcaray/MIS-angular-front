import { AZUL, MAGENTA, NARANJA, NAVY, colorSerieReporte, esPorcentaje, tokensTema } from './paleta-colores.util';

describe('paleta de gráficos', () => {
  it('distingue porcentajes por el nombre de la serie', () => {
    expect(esPorcentaje('Participación %')).toBe(true);
    expect(esPorcentaje('Saldo')).toBe(false);
  });

  it('asigna los colores semánticos de los reportes', () => {
    expect(colorSerieReporte('Clientes', false)).toBe(AZUL);
    expect(colorSerieReporte('Saldo vencido', false)).toBe(MAGENTA);
    expect(colorSerieReporte('Participación %', false)).toBe(MAGENTA);
    expect(colorSerieReporte('Tasa %', false)).toBe(NARANJA);
    expect(colorSerieReporte('Saldo', false)).toBe(NAVY);
  });

  it('resuelve tokens coherentes para ambos temas', () => {
    expect(tokensTema(false).fondo).toBe('#FFFFFF');
    expect(tokensTema(true).fondo).toBe('#162034');
  });
});
