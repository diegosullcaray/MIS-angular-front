import { rutaMascota, skinDeTemporada } from './mascota.util';

describe('mascota.util', () => {
  it('en octubre Pachi usa la skin de Halloween', () => {
    expect(skinDeTemporada(new Date(2026, 9, 1))).toBe('halloween');
    expect(skinDeTemporada(new Date(2026, 9, 31))).toBe('halloween');
    expect(rutaMascota('feliz', new Date(2026, 9, 15))).toBe('/assets/images/fc/tours/skins/halloween/mascota-feliz.png');
  });

  it('fuera de temporada usa la pose base', () => {
    expect(skinDeTemporada(new Date(2026, 8, 30))).toBeNull();
    expect(skinDeTemporada(new Date(2026, 10, 1))).toBeNull();
    expect(rutaMascota('guia', new Date(2026, 5, 1))).toBe('/assets/images/fc/tours/mascota-guia.png');
  });
});
