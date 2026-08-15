import { fechaBasePorDefecto, generarOpcionesFechaBase } from './plan-datos.model';

describe('generarOpcionesFechaBase()', () => {
  it('genera 12 opciones (11 fin-de-mes cerrados + "ayer"), de más reciente a más antiguo', () => {
    const hoy = new Date(2026, 7, 14); // 14/08/2026 (mes 0-indexado)
    const opciones = generarOpcionesFechaBase(hoy);

    expect(opciones).toHaveLength(12);
    expect(opciones[0]).toEqual({ id: '20260813', desc: 'agosto - 2026' }); // "ayer"
    expect(opciones[1]).toEqual({ id: '20260731', desc: 'julio - 2026' }); // mes cerrado más reciente
    expect(opciones[11]).toEqual({ id: '20250930', desc: 'septiembre - 2025' }); // 11 meses cerrados atrás
  });
});

describe('fechaBasePorDefecto()', () => {
  it('selecciona el mes cerrado más reciente (índice 1 tras invertir), no "ayer"', () => {
    const hoy = new Date(2026, 7, 14);
    expect(fechaBasePorDefecto(hoy)).toBe('20260731');
  });
});
