import { CONTRASTE, componerSobre, contraste } from './contraste.util';
import { TEMAS, type TokenColor } from './tokens.paleta';

/**
 * Contraste de la paleta del sistema.
 *
 * Los tokens son la única fuente de color del Host —Tailwind los consume con
 * `text-[var(--mis-*)]` y PrimeNG a través del preset `MisTheme`—, así que si un
 * par texto/fondo no llega al umbral WCAG, TODA la interfaz que use ese par
 * queda por debajo, no una pantalla suelta.
 *
 * `tokens.paleta.ts` lo genera `scripts/generar-tokens-paleta.mjs` desde
 * `tokens.css`: estos tests miden los valores reales del sistema, no una copia.
 */

/** Resuelve un token a un hex opaco, componiéndolo sobre su fondo si tiene alfa. */
function resolver(tokens: Record<TokenColor, string>, token: TokenColor, fondo: TokenColor): string {
  const valor = tokens[token];
  const base = tokens[fondo];
  return componerSobre(valor, componerSobre(base, '#000000') ?? '#000000') ?? valor;
}

function razon(tokens: Record<TokenColor, string>, texto: TokenColor, fondo: TokenColor): number {
  const colorTexto = resolver(tokens, texto, fondo);
  const colorFondo = componerSobre(tokens[fondo], '#000000') ?? tokens[fondo];
  return contraste(colorTexto, colorFondo) ?? 0;
}

/** Los tres niveles de texto sobre las cuatro superficies donde se los usa. */
const PARES_TEXTO: readonly (readonly [TokenColor, TokenColor])[] = [
  ['mis-text-primary', 'mis-bg'],
  ['mis-text-primary', 'mis-surface'],
  ['mis-text-primary', 'mis-panel-bg'],
  ['mis-text-secondary', 'mis-bg'],
  ['mis-text-secondary', 'mis-surface'],
  ['mis-text-secondary', 'mis-panel-bg'],
];

/** Texto sobre los fondos sólidos de marca y de estado. */
const PARES_SOBRE_COLOR: readonly (readonly [TokenColor, TokenColor])[] = [
  ['mis-text-on-primary', 'mis-primary'],
  ['mis-text-on-secondary', 'mis-secondary'],
];

/** Los colores semánticos, usados como TEXTO sobre las superficies del sistema. */
const SEMANTICOS: readonly TokenColor[] = ['mis-success', 'mis-warning', 'mis-danger'];

/** Cada color de estado sobre su propia variante clara — el par de los chips. */
const PARES_ESTADO: readonly (readonly [TokenColor, TokenColor])[] = [
  ['mis-success', 'mis-success-light'],
  ['mis-warning', 'mis-warning-light'],
  ['mis-danger', 'mis-danger-light'],
];

describe.each(TEMAS)('Tokens de color — tema $nombre', ({ tokens }) => {
  describe('texto de cuerpo (WCAG AA, 4.5:1)', () => {
    it.each(PARES_TEXTO)('%s sobre %s', (texto, fondo) => {
      expect(razon(tokens, texto, fondo)).toBeGreaterThanOrEqual(CONTRASTE.textoAA);
    });
  });

  describe('texto sobre fondos de marca (WCAG AA, 4.5:1)', () => {
    it.each(PARES_SOBRE_COLOR)('%s sobre %s', (texto, fondo) => {
      expect(razon(tokens, texto, fondo)).toBeGreaterThanOrEqual(CONTRASTE.textoAA);
    });
  });

  describe('colores de estado como texto (WCAG AA, 4.5:1)', () => {
    it.each(SEMANTICOS)('%s sobre la superficie', (semantico) => {
      expect(razon(tokens, semantico, 'mis-surface')).toBeGreaterThanOrEqual(CONTRASTE.textoAA);
    });

    it.each(PARES_ESTADO)('%s sobre %s', (color, fondo) => {
      expect(razon(tokens, color, fondo)).toBeGreaterThanOrEqual(CONTRASTE.textoAA);
    });
  });

  describe('componentes de interfaz (WCAG 1.4.11, 3:1)', () => {
    // Solo `--mis-border-control` delimita un control por sí mismo (el borde de
    // un input, sin fondo que lo distinga): es el que tiene que llegar a 3:1.
    it.each(['mis-surface', 'mis-bg', 'mis-panel-bg'] as const)(
      'el borde de control se distingue de %s',
      (fondo) => {
        expect(razon(tokens, 'mis-border-control', fondo)).toBeGreaterThanOrEqual(CONTRASTE.interfaz);
      },
    );

    it('el color primario se distingue del fondo de la página', () => {
      expect(razon(tokens, 'mis-primary', 'mis-bg')).toBeGreaterThanOrEqual(CONTRASTE.interfaz);
    });

    it.each(['mis-surface', 'mis-bg', 'mis-panel-bg'] as const)(
      'el acento se distingue de %s',
      (fondo) => {
        expect(razon(tokens, 'mis-accent', fondo)).toBeGreaterThanOrEqual(CONTRASTE.interfaz);
      },
    );
  });

  describe('bordes decorativos', () => {
    // `--mis-border` y `--mis-border-strong` son divisores, no contornos de
    // control: no les aplica el 3:1 (subirlos encuadraría toda la interfaz).
    // Lo que sí tienen que hacer es VERSE: por debajo de 1.2:1 el divisor
    // desaparece contra la superficie y la retícula se pierde.
    it.each(['mis-border', 'mis-border-strong'] as const)('%s es perceptible sobre la superficie', (borde) => {
      expect(razon(tokens, borde, 'mis-surface')).toBeGreaterThanOrEqual(1.2);
    });

    it('el borde fuerte contrasta más que el normal', () => {
      expect(razon(tokens, 'mis-border-strong', 'mis-surface')).toBeGreaterThan(
        razon(tokens, 'mis-border', 'mis-surface'),
      );
    });
  });

  describe('texto terciario (deshabilitado y metadatos, AA grande 3:1)', () => {
    // El terciario rotula metadatos y estados apagados: no llega —ni tiene que
    // llegar— al 4.5:1 del cuerpo, pero sí al 3:1 por debajo del cual deja de
    // leerse.
    it('sobre la superficie', () => {
      expect(razon(tokens, 'mis-text-tertiary', 'mis-surface')).toBeGreaterThanOrEqual(
        CONTRASTE.textoGrandeAA,
      );
    });
  });
});

describe('Tokens de color — coherencia entre temas', () => {
  const [claro, oscuro] = TEMAS;

  it('los dos temas declaran exactamente los mismos tokens', () => {
    expect(Object.keys(oscuro.tokens).sort()).toEqual(Object.keys(claro.tokens).sort());
  });

  it('ningún token queda con el mismo valor en los dos temas si es de texto o superficie', () => {
    // Un token de texto o de fondo idéntico en claro y oscuro casi siempre es
    // un olvido en el bloque `.dark`, y se ve como texto ilegible al cambiar de
    // tema. Se exceptúa `mis-text-on-secondary`, que es navy en los dos a
    // propósito: el secundario es un celeste brillante en ambos.
    const excepciones = new Set(['mis-text-on-secondary', 'mis-text-on-primary']);
    const sospechosos = (Object.keys(claro.tokens) as TokenColor[])
      .filter((t) => /^mis-(text|bg|surface|panel)/.test(t))
      .filter((t) => !excepciones.has(t))
      .filter((t) => claro.tokens[t] === oscuro.tokens[t]);

    expect(sospechosos).toEqual([]);
  });
});
