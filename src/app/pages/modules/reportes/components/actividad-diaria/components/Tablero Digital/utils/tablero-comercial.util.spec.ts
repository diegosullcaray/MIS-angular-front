import { semaforoCumplimiento, semaforoVariacion, semaforosTableroComercial } from './tablero-comercial.util';

describe('semáforos de Tablero Digital Comercial (trafficFn del legado)', () => {
  it('variación: verde si no baja, rojo si baja o no hay dato', () => {
    expect(semaforoVariacion(12)).toBe(1);
    expect(semaforoVariacion(0)).toBe(1);
    expect(semaforoVariacion(-3)).toBe(-1);
    expect(semaforoVariacion(null)).toBe(-1);
  });

  it('cumplimiento: verde desde 100 %, ámbar desde 80 %, rojo debajo o sin dato', () => {
    expect(semaforoCumplimiento(1.05)).toBe(1);
    expect(semaforoCumplimiento(1)).toBe(1);
    expect(semaforoCumplimiento(0.85)).toBe(0);
    expect(semaforoCumplimiento(0.79)).toBe(-1);
    expect(semaforoCumplimiento(undefined)).toBe(-1);
  });

  it('agrega los tres semáforos a cada fila sin tocar sus datos', () => {
    const [fila] = semaforosTableroComercial([{ descripcion: 'FC', var_enro: -2, cumplUsa: 0.9, cumplUsaCar: 1.2 }]);
    expect(fila).toMatchObject({ descripcion: 'FC', sem_var_enro: -1, sem_cumplUsa: 0, sem_cumplUsaCar: 1 });
  });
});
