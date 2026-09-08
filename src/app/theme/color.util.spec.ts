import {
  aclarar,
  esColorClaro,
  hexARgb,
  hexARgba,
  luminancia,
  mezclar,
  normalizarHex,
  oscurecer,
  rgbAHex,
  textoSobre,
} from './color.util';

/**
 * Aritmética de color. Todo lo de acá alimenta las variables CSS de la
 * apariencia: un redondeo mal hecho no rompe nada visible, pinta un texto
 * ilegible sobre el acento que eligió el usuario.
 */
describe('color.util', () => {
  describe('normalizarHex()', () => {
    it('pasa a minúsculas, expande la forma corta y tolera espacios', () => {
      expect(normalizarHex('#1D396E')).toBe('#1d396e');
      expect(normalizarHex('  #1D396E  ')).toBe('#1d396e');
      expect(normalizarHex('#abc')).toBe('#aabbcc');
    });

    // La almohadilla es obligatoria: lo que entra acá viene de un `<input
    // type="color">` o de un token, y los dos la traen.
    it('devuelve null ante cualquier cosa que no sea un hex con #', () => {
      expect(normalizarHex('1D396E')).toBeNull();
      expect(normalizarHex('')).toBeNull();
      expect(normalizarHex('rojo')).toBeNull();
      expect(normalizarHex('#12345')).toBeNull();
      expect(normalizarHex('#zzzzzz')).toBeNull();
    });
  });

  it('hexARgb() y rgbAHex() son inversos', () => {
    expect(hexARgb('#1d396e')).toEqual({ r: 29, g: 57, b: 110 });
    expect(rgbAHex({ r: 29, g: 57, b: 110 })).toBe('#1d396e');
  });

  it('rgbAHex() recorta los componentes fuera de rango en vez de emitir basura', () => {
    expect(rgbAHex({ r: -20, g: 300, b: 128 })).toBe('#00ff80');
  });

  it('hexARgba() arma el rgba() que consume el CSS', () => {
    expect(hexARgba('#1d396e', 0.5)).toBe('rgba(29, 57, 110, 0.5)');
    expect(hexARgba('no-es-color', 0.5)).toBeNull();
  });

  describe('mezclar()', () => {
    it('con peso 0 y 1 devuelve cada extremo', () => {
      expect(mezclar('#000000', '#ffffff', 0)).toBe('#000000');
      expect(mezclar('#000000', '#ffffff', 1)).toBe('#ffffff');
    });

    it('a mitad de camino da el punto medio', () => {
      expect(mezclar('#000000', '#ffffff', 0.5)).toBe('#808080');
    });

    it('aclarar() va hacia el blanco y oscurecer() hacia el negro', () => {
      const base = '#808080';
      expect(luminancia(aclarar(base, 0.5)!)!).toBeGreaterThan(luminancia(base)!);
      expect(luminancia(oscurecer(base, 0.5)!)!).toBeLessThan(luminancia(base)!);
    });
  });

  describe('luminancia() y el texto que va encima', () => {
    it('el blanco y el negro son los extremos', () => {
      expect(luminancia('#ffffff')).toBeCloseTo(1, 5);
      expect(luminancia('#000000')).toBeCloseTo(0, 5);
    });

    // Es la decisión que evita un texto ilegible sobre el acento elegido.
    it('sobre un fondo claro el texto va oscuro, y al revés', () => {
      expect(esColorClaro('#ffffff')).toBe(true);
      expect(esColorClaro('#1d396e')).toBe(false);
      expect(textoSobre('#ffffff')).not.toBe(textoSobre('#1d396e'));
    });
  });
});
