import {
  CONTRASTE,
  contraste,
  distanciaPerceptual,
  separacionMinima,
  aOklch,
} from '../../../../theme/contraste.util';
import { PALETA_SERIES, PALETA_TRAMOS, tokensTema, AZUL, MAGENTA, NARANJA, NAVY } from './paleta-colores.util';

/**
 * Armonía de las paletas de gráficos.
 *
 * En un gráfico el color ES el dato: si dos series no se distinguen, el gráfico
 * miente. Estos tests miden lo que se puede medir —separación perceptual en
 * OKLab, cómo se ven bajo los tres daltonismos y el contraste contra el fondo
 * del gráfico— en vez de confiar en que "se ven distintas".
 *
 * Umbrales, en Delta E de OKLab ×100:
 *  - 15 es el piso para visión normal: por debajo, un lector sin problemas de
 *    visión ya no separa las dos series.
 *  - 8 es el objetivo bajo daltonismo simulado; entre 6 y 8 es aceptable solo si
 *    hay una segunda codificación (etiqueta directa, forma o textura).
 */

const PISO_VISION_NORMAL = 15;
const OBJETIVO_DALTONISMO = 8;
const PISO_DALTONISMO = 6;

/** Todos los pares de una paleta, sin repetir. */
function pares(paleta: readonly string[]): [string, string][] {
  const salida: [string, string][] = [];
  for (let i = 0; i < paleta.length; i++) {
    for (let j = i + 1; j < paleta.length; j++) salida.push([paleta[i], paleta[j]]);
  }
  return salida;
}

/** Pares contiguos: son los que quedan uno al lado del otro en una leyenda o una barra apilada. */
function paresContiguos(paleta: readonly string[]): [string, string][] {
  return paleta.slice(0, -1).map((c, i) => [c, paleta[i + 1]] as [string, string]);
}

describe('PALETA_SERIES (series genéricas de reportes)', () => {
  it('no repite ningún color', () => {
    expect(new Set(PALETA_SERIES).size).toBe(PALETA_SERIES.length);
  });

  it('los pares contiguos se distinguen a simple vista (Delta E >= 15)', () => {
    // Contiguos y no los 45 pares: la paleta está ORDENADA para que los tonos
    // parecidos queden lejos entre sí, y lo que se compara en una leyenda o
    // entre dos porciones de una torta es una serie con la de al lado.
    const flojos = paresContiguos(PALETA_SERIES)
      .map(([a, b]) => ({ a, b, d: distanciaPerceptual(a, b) ?? 0 }))
      .filter(({ d }) => d < PISO_VISION_NORMAL)
      .map(({ a, b, d }) => `${a}/${b}=${d.toFixed(1)}`);

    expect(flojos).toEqual([]);
  });

  it('los pares contiguos se sostienen bajo daltonismo (Delta E >= 6)', () => {
    // Contiguos y no todos: en una leyenda lo que se compara es el color de una
    // serie con el de la de al lado.
    const flojos = paresContiguos(PALETA_SERIES)
      .map(([a, b]) => ({ a, b, d: separacionMinima(a, b) ?? 0 }))
      .filter(({ d }) => d < PISO_DALTONISMO)
      .map(({ a, b, d }) => `${a}/${b}=${d.toFixed(1)}`);

    expect(flojos).toEqual([]);
  });

  it('ningún color se lee como gris (croma OKLCH >= 0.06)', () => {
    // Un color de serie sin croma pierde su identidad: deja de ser "el violeta"
    // y pasa a ser "uno de los grises".
    const grises = PALETA_SERIES.filter((c) => (aOklch(c)?.c ?? 0) < 0.06);
    expect(grises).toEqual([]);
  });

  it.each(['claro', 'oscuro'] as const)('ninguna serie desaparece sobre el fondo del gráfico (%s)', (tema) => {
    // Umbral de VISIBILIDAD, no el 3:1 de componente de interfaz: una porción de
    // torta es un dato, no un control, y va acompañada de leyenda y etiqueta.
    // Seis de estos colores quedan entre 2.0 y 2.8 sobre el blanco del tema
    // claro — está registrado en la auditoría, y por eso los gráficos NO pueden
    // quedarse sin leyenda.
    const { fondo } = tokensTema(tema === 'oscuro');
    const invisibles = PALETA_SERIES.filter((c) => (contraste(c, fondo) ?? 0) < 1.6);
    expect(invisibles).toEqual([]);
  });
});

describe('PALETA_TRAMOS (tramos de mora del analista)', () => {
  it('no repite ningún color', () => {
    expect(new Set(PALETA_TRAMOS).size).toBe(PALETA_TRAMOS.length);
  });

  it('los tramos contiguos se distinguen a simple vista (Delta E >= 15)', () => {
    // Contiguos porque los tramos son una escala ordenada: lo que hay que poder
    // separar es un tramo del siguiente.
    const flojos = paresContiguos(PALETA_TRAMOS)
      .map(([a, b]) => ({ a, b, d: distanciaPerceptual(a, b) ?? 0 }))
      .filter(({ d }) => d < PISO_VISION_NORMAL)
      .map(({ a, b, d }) => `${a}/${b}=${d.toFixed(1)}`);

    expect(flojos).toEqual([]);
  });

  it.each(['claro', 'oscuro'] as const)('todos los tramos llegan a 3:1 sobre el fondo del gráfico (%s)', (tema) => {
    // Acá sí se exige el 3:1 en los dos temas: los tramos son pocos y fijos, y
    // el dashboard del analista los pinta también como puntos y chips sueltos,
    // sin una leyenda que los rescate.
    const { fondo } = tokensTema(tema === 'oscuro');
    const flojos = PALETA_TRAMOS.filter((c) => (contraste(c, fondo) ?? 0) < CONTRASTE.interfaz);
    expect(flojos).toEqual([]);
  });
});

describe('Paleta de reportes mixtos (roles fijos)', () => {
  /** Los cuatro roles que `colorSerieReporte()` llega a asignar. */
  const ROLES = { NAVY, MAGENTA, NARANJA, AZUL };

  it('los cuatro roles se distinguen entre sí (Delta E >= 15)', () => {
    // Acá sí van TODOS los pares: los roles no tienen orden, cualquiera de los
    // cinco puede caer al lado de cualquier otro en el mismo gráfico.
    const colores = Object.values(ROLES);
    const flojos = pares(colores)
      .map(([a, b]) => ({ a, b, d: distanciaPerceptual(a, b) ?? 0 }))
      .filter(({ d }) => d < PISO_VISION_NORMAL)
      .map(({ a, b, d }) => `${a}/${b}=${d.toFixed(1)}`);

    expect(flojos).toEqual([]);
  });

  it('el par que más se usa junto (saldo navy / vencido magenta) aguanta el daltonismo', () => {
    // Es el par de "Saldo" contra "Saldo Vencido": el que aparece en casi todos
    // los reportes de cartera y el que no puede confundirse.
    expect(separacionMinima(NAVY, MAGENTA) ?? 0).toBeGreaterThanOrEqual(OBJETIVO_DALTONISMO);
  });
});

describe('Tokens de tema de Highcharts', () => {
  it.each([false, true])('el texto de ejes y leyenda es legible sobre el fondo (oscuro=%s)', (oscuro) => {
    const { fondo, texto, textoFuerte } = tokensTema(oscuro);
    expect(contraste(texto, fondo) ?? 0).toBeGreaterThanOrEqual(CONTRASTE.textoGrandeAA);
    expect(contraste(textoFuerte, fondo) ?? 0).toBeGreaterThanOrEqual(CONTRASTE.textoAA);
  });
});
