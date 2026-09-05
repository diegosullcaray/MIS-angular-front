import {
  CATALOGO_FONDOS,
  FONDO_PERSONALIZADO,
  PREFERENCIAS_POR_DEFECTO,
  buscarFondo,
  fondoEfectivo,
  sanearPreferencias,
} from './preferencias.model';
import { aclarar, esColorClaro, hexARgb, hexARgba, mezclar, normalizarHex, textoSobre } from './color.util';

describe('sanearPreferencias', () => {
  /**
   * Es la frontera del dominio: lo que viene de `localStorage` puede ser de una
   * versión anterior, estar a medias o directamente corrupto, y nada de eso
   * puede terminar escrito como variable CSS en <html>.
   */
  it('devuelve los valores de fábrica ante cualquier cosa que no sean preferencias', () => {
    for (const basura of [null, undefined, 42, 'texto', [], { apariencia: 'no-es-objeto' }]) {
      expect(sanearPreferencias(basura)).toEqual(PREFERENCIAS_POR_DEFECTO);
    }
  });

  it('conserva lo válido y repone campo por campo lo que no entiende', () => {
    const saneadas = sanearPreferencias({
      apariencia: { tema: 'claro', fondo: 'navy', colorFondo: 'no-es-color', acento: '#ABC' },
      estructura: { modoSidebar: 'horizontal', etiquetasSidebar: 'sí', vistaExplorador: 'lista' },
      anuncios: { vistos: ['a', 7, 'b'], silenciar: 'quizá' },
    });

    expect(saneadas.apariencia.tema).toBe('claro');
    expect(saneadas.apariencia.fondo).toBe('navy');
    // El hex inválido cae al de fábrica; el corto se normaliza a seis dígitos.
    expect(saneadas.apariencia.colorFondo).toBe(PREFERENCIAS_POR_DEFECTO.apariencia.colorFondo);
    expect(saneadas.apariencia.acento).toBe('#aabbcc');
    expect(saneadas.estructura.modoSidebar).toBe('horizontal');
    expect(saneadas.estructura.etiquetasSidebar).toBe(PREFERENCIAS_POR_DEFECTO.estructura.etiquetasSidebar);
    expect(saneadas.estructura.vistaExplorador).toBe('lista');
    // Los ids que no son texto se descartan sin tirar abajo la lista entera.
    expect(saneadas.anuncios.vistos).toEqual(['a', 'b']);
    expect(saneadas.anuncios.silenciar).toBe(false);
  });

  it('descarta un fondo que ya no existe en el catálogo', () => {
    const saneadas = sanearPreferencias({ apariencia: { fondo: 'fondo-de-una-version-vieja' } });
    expect(saneadas.apariencia.fondo).toBe(PREFERENCIAS_POR_DEFECTO.apariencia.fondo);
  });

  it('un modo de menú desconocido no se cuela hasta el atributo del <html>', () => {
    expect(sanearPreferencias({ estructura: { modoSidebar: 'flotante' } }).estructura.modoSidebar).toBe('estatico');
  });
});

describe('fondoEfectivo', () => {
  it('resuelve el fondo personalizado con el color que eligió el usuario', () => {
    const fondo = fondoEfectivo({
      tema: 'oscuro',
      fondo: FONDO_PERSONALIZADO,
      colorFondo: '#123456',
      acento: '#00a2ff',
    });

    expect(fondo.tipo).toBe('color');
    expect(fondo.valor).toBe('#123456');
  });

  it('los fondos del catálogo se usan tal cual, sin mirar el color personalizado', () => {
    const navy = buscarFondo('navy')!;
    const fondo = fondoEfectivo({ tema: 'oscuro', fondo: 'navy', colorFondo: '#123456', acento: '#00a2ff' });

    expect(fondo.valor).toBe(navy.valor);
  });

  it('solo la foto institucional queda marcada como tal: el resto pierde el velo del tema', () => {
    const institucionales = CATALOGO_FONDOS.filter((f) => f.institucional);
    expect(institucionales).toHaveLength(1);
    expect(institucionales[0].clave).toBe('institucional');
  });
});

describe('color.util', () => {
  it('normaliza el hex corto, el largo y las mayúsculas; rechaza el resto', () => {
    expect(normalizarHex('#ABC')).toBe('#aabbcc');
    expect(normalizarHex('  #1D396E  ')).toBe('#1d396e');
    expect(normalizarHex('rgb(0,0,0)')).toBeNull();
    expect(normalizarHex('#12345')).toBeNull();
  });

  it('convierte a rgb y a rgba', () => {
    expect(hexARgb('#1d396e')).toEqual({ r: 29, g: 57, b: 110 });
    expect(hexARgba('#000000', 0.35)).toBe('rgba(0, 0, 0, 0.35)');
    expect(hexARgba('nada', 0.5)).toBeNull();
  });

  it('mezcla acotando el peso a [0, 1]', () => {
    expect(mezclar('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mezclar('#000000', '#ffffff', 5)).toBe('#ffffff');
    expect(mezclar('#000000', '#ffffff', -2)).toBe('#000000');
    expect(aclarar('#000000', 1)).toBe('#ffffff');
  });

  it('decide el color del texto según la luminancia del fondo', () => {
    expect(esColorClaro('#ffffff')).toBe(true);
    expect(esColorClaro('#0e1626')).toBe(false);
    expect(textoSobre('#f4f6f9')).toBe('#0f1e2e');
    expect(textoSobre('#1d396e')).toBe('#ffffff');
  });
});
