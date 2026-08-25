import { fechaCorte, fechaCorteCompacta, fechaUltimoDia } from './fecha-reporte.util';

describe('fecha-reporte.util', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // 25/08/2026 a media mañana, hora local.
    vi.setSystemTime(new Date(2026, 7, 25, 10, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('`fechaUltimoDia` devuelve ayer en `YYYYMMDD` — el `fec_day_ult` del legado', () => {
    expect(fechaUltimoDia()).toBe('20260824');
  });

  it('prefiere la fecha de corte que declara el backend', () => {
    expect(fechaCorteCompacta('20260731')).toBe('20260731');
    expect(fechaCorte('20260731')).toBe('2026-07-31');
  });

  it('las dos variantes caen al MISMO día cuando el backend aún no expuso su corte', () => {
    // Pedir HOY a la jerarquía devuelve `level_hierarchy` vacío (el backend no
    // cerró el día en curso) y el selector aborta con "No se pudo cargar la
    // jerarquía"; por eso el fallback es ayer, no hoy.
    expect(fechaCorteCompacta(undefined)).toBe('20260824');
    expect(fechaCorte(undefined)).toBe('2026-08-24');
  });

  it('ignora un corte con formato inesperado y usa el fallback', () => {
    expect(fechaCorte('2026-07-31')).toBe('2026-08-24');
    expect(fechaCorteCompacta('')).toBe('20260824');
  });

  it('no cruza de día por UTC en horario de Perú (UTC-5)', () => {
    vi.setSystemTime(new Date(2026, 7, 25, 21, 30, 0));
    expect(fechaUltimoDia()).toBe('20260824');
    expect(fechaCorte(undefined)).toBe('2026-08-24');
  });
});
