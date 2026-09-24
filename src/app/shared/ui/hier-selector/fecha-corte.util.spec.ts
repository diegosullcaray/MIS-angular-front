import { fechaCorteJerarquia } from './fecha-corte.util';

describe('fechaCorteJerarquia', () => {
  it('normaliza los dos formatos válidos del backend', () => {
    expect(fechaCorteJerarquia('20260923')).toBe('2026-09-23');
    expect(fechaCorteJerarquia('2026-09-23')).toBe('2026-09-23');
  });

  it('usa ayer local si el perfil no entrega una fecha válida', () => {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const esperado = `${ayer.getFullYear()}-${String(ayer.getMonth() + 1).padStart(2, '0')}-${String(ayer.getDate()).padStart(2, '0')}`;

    expect(fechaCorteJerarquia('23/09/2026')).toBe(esperado);
    expect(fechaCorteJerarquia(undefined)).toBe(esperado);
  });
});
