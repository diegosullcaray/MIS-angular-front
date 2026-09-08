import {
  CONTRASTE,
  aOklch,
  aRgba,
  componerSobre,
  contraste,
  distanciaPerceptual,
  separacionMinima,
  simularDaltonismo,
} from './contraste.util';

/**
 * Aritmética de contraste y percepción de color. Hasta ahora solo se probaba
 * de rebote, a través de `tokens.paleta.spec.ts` y de la paleta de gráficos:
 * si una de estas fórmulas se rompía, el spec que fallaba era el de la paleta
 * y el diagnóstico apuntaba al color equivocado.
 *
 * Los valores esperados son los de referencia de las fórmulas estándar, no
 * capturas de la implementación.
 */
describe('contraste', () => {
  it('blanco sobre negro es el máximo de la escala WCAG: 21', () => {
    expect(contraste('#ffffff', '#000000')).toBeCloseTo(21, 5);
  });

  it('un color contra sí mismo es 1', () => {
    expect(contraste('#1d396e', '#1d396e')).toBeCloseTo(1, 10);
  });

  it('es simétrico: da igual cuál es texto y cuál fondo', () => {
    expect(contraste('#ffffff', '#767676')).toBeCloseTo(contraste('#767676', '#ffffff')!, 10);
  });

  it('#767676 sobre blanco es el gris límite de AA (4.5)', () => {
    expect(contraste('#767676', '#ffffff')).toBeGreaterThanOrEqual(CONTRASTE.textoAA);
    // Un tono más claro ya no llega.
    expect(contraste('#777777', '#ffffff')).toBeLessThan(CONTRASTE.textoAA);
  });

  it('devuelve null si alguno de los dos no es un color', () => {
    expect(contraste('no-es-color', '#ffffff')).toBeNull();
    expect(contraste('#ffffff', '')).toBeNull();
  });
});

describe('componerSobre', () => {
  it('un negro al 50% sobre blanco da el gris medio', () => {
    // Sin esto no se puede medir el contraste de los tokens rgba() del sistema.
    expect(componerSobre('rgba(0, 0, 0, 0.5)', '#ffffff')).toBe('#808080');
  });

  it('un color opaco sobre cualquier fondo se devuelve igual', () => {
    expect(componerSobre('rgb(29, 57, 110)', '#ffffff')).toBe('#1d396e');
  });

  it('transparente sobre un fondo devuelve el fondo', () => {
    expect(componerSobre('transparent', '#1d396e')).toBe('#1d396e');
  });

  it('devuelve null si el fondo no es un hex opaco', () => {
    expect(componerSobre('rgba(0,0,0,0.5)', 'no-es-color')).toBeNull();
  });
});

describe('aRgba', () => {
  it('acepta las formas que usan los tokens del sistema', () => {
    expect(aRgba('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(aRgba('#1d396e')).toEqual({ r: 29, g: 57, b: 110, a: 1 });
    expect(aRgba('rgb(29, 57, 110)')).toEqual({ r: 29, g: 57, b: 110, a: 1 });
    expect(aRgba('rgba(29, 57, 110, 0.84)')).toEqual({ r: 29, g: 57, b: 110, a: 0.84 });
    expect(aRgba('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });

  it('tolera espacios de más y comas sin espacio, que es como están escritos los tokens', () => {
    expect(aRgba('  rgba(29,57,110,0.5)  ')).toEqual({ r: 29, g: 57, b: 110, a: 0.5 });
    expect(aRgba('rgba(29, 57, 110, 0.84)')).toEqual({ r: 29, g: 57, b: 110, a: 0.84 });
  });

  it('NO entiende la sintaxis moderna con espacios y barra, y hoy no hace falta', () => {
    // Ningún token de `tokens.css` la usa: todos son de la forma con comas.
    // Queda anotado porque un token escrito así devolvería null acá, y de ahí
    // en más el contraste de ese token no se podría medir.
    expect(aRgba('rgb(29 57 110 / 0.5)')).toBeNull();
  });

  it('rechaza lo que no es un color', () => {
    expect(aRgba('rgb(29, 57)')).toBeNull();
    expect(aRgba('rgba(a, b, c, d)')).toBeNull();
    expect(aRgba('azul')).toBeNull();
  });
});

describe('aOklch', () => {
  it('el negro y el blanco marcan los extremos de luminosidad, sin croma', () => {
    expect(aOklch('#000000')!.l).toBeCloseTo(0, 6);
    expect(aOklch('#ffffff')!.l).toBeCloseTo(1, 5);
    expect(aOklch('#ffffff')!.c).toBeCloseTo(0, 5);
  });

  it('un gris no tiene croma: es lo que lo hace leerse como gris', () => {
    expect(aOklch('#808080')!.c).toBeLessThan(0.01);
  });

  it('un color saturado sí lo tiene', () => {
    expect(aOklch('#ff0000')!.c).toBeGreaterThan(0.1);
  });

  it('devuelve null si no es un hex', () => {
    expect(aOklch('rgba(0,0,0,1)')).toBeNull();
  });
});

describe('distanciaPerceptual', () => {
  it('un color contra sí mismo es 0', () => {
    expect(distanciaPerceptual('#1d396e', '#1d396e')).toBeCloseTo(0, 10);
  });

  it('blanco y negro son el par más separado', () => {
    expect(distanciaPerceptual('#ffffff', '#000000')).toBeGreaterThan(90);
  });

  it('dos tonos casi iguales quedan por debajo del umbral de 15 que usa la paleta', () => {
    expect(distanciaPerceptual('#1d396e', '#1e3a6f')).toBeLessThan(15);
  });

  it('es simétrica', () => {
    const ida = distanciaPerceptual('#ff0000', '#00ff00');
    expect(distanciaPerceptual('#00ff00', '#ff0000')).toBeCloseTo(ida!, 10);
  });
});

describe('simularDaltonismo', () => {
  it('un gris se ve igual con cualquier daltonismo: no tiene tono que confundir', () => {
    for (const tipo of ['protanopia', 'deuteranopia', 'tritanopia'] as const) {
      const simulado = aOklch(simularDaltonismo('#808080', tipo)!)!;
      expect(simulado.c).toBeLessThan(0.02);
    }
  });

  it('el rojo cambia con protanopia y deuteranopia, que son las que lo afectan', () => {
    expect(simularDaltonismo('#ff0000', 'protanopia')).not.toBe('#ff0000');
    expect(simularDaltonismo('#ff0000', 'deuteranopia')).not.toBe('#ff0000');
  });

  it('devuelve un hex válido', () => {
    expect(simularDaltonismo('#1d396e', 'deuteranopia')).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('devuelve null si no es un hex', () => {
    expect(simularDaltonismo('no-es-color', 'protanopia')).toBeNull();
  });
});

describe('separacionMinima', () => {
  it('nunca supera la distancia de la visión normal: toma el peor de los cuatro casos', () => {
    const normal = distanciaPerceptual('#ff0000', '#00aa00')!;
    expect(separacionMinima('#ff0000', '#00aa00')).toBeLessThanOrEqual(normal + 1e-9);
  });

  it('rojo y verde se separan bien a simple vista y se juntan con daltonismo', () => {
    // Es exactamente el caso que esta función existe para detectar en las
    // series de un gráfico: dos colores que "se ven distintos" y no lo son
    // para una parte de los usuarios.
    const normal = distanciaPerceptual('#ff0000', '#00aa00')!;
    expect(normal).toBeGreaterThan(30);
    expect(separacionMinima('#ff0000', '#00aa00')).toBeLessThan(normal);
  });

  it('un color contra sí mismo es 0 en todos los casos', () => {
    expect(separacionMinima('#1d396e', '#1d396e')).toBeCloseTo(0, 10);
  });

  it('devuelve null si alguno no es un color', () => {
    expect(separacionMinima('azul', '#ffffff')).toBeNull();
  });
});
