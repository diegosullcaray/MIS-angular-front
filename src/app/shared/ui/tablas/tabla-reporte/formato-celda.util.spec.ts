import { formatearCeldaReporte } from './formato-celda.util';

describe('formatearCeldaReporte', () => {
  it('número con separador de miles y sin decimales de más', () => {
    expect(formatearCeldaReporte(3254743, { columnDef: 'x', format: { type: 'number' } })).toBe('3,254,743');
  });

  it('respeta `mode` y `unit` del backend', () => {
    expect(formatearCeldaReporte(23, { columnDef: 'x', format: { type: 'number', mode: '.0-0', unit: 'pbs' } })).toBe('23 pbs');
    expect(formatearCeldaReporte(0.2332, { columnDef: 'x', format: { type: 'percent', mode: '1.2-2' } })).toBe('23.32%');
  });

  it('el texto del motor y las celdas vacías pasan tal cual', () => {
    expect(formatearCeldaReporte('95.94%', { columnDef: 'x', format: { type: 'number' } })).toBe('95.94%');
    expect(formatearCeldaReporte(null, { columnDef: 'x' })).toBe('');
    expect(formatearCeldaReporte(12, { columnDef: 'x' })).toBe('12');
  });
});
