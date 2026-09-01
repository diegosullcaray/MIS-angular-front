import { comunicadoVigente, estaPendiente } from './anuncio.model';
import type { Anuncio } from './anuncio.model';

const HOY = '2026-09-01';

function anuncio(parcial: Partial<Anuncio> & Pick<Anuncio, 'id'>): Anuncio {
  return {
    imagen: 'assets/images/fc/ads/Comunicado.png',
    alt: 'Comunicado de prueba',
    ancho: 780,
    alto: 815,
    ...parcial,
  };
}

/**
 * La incidencia era concreta: el diálogo de comunicados aparecía en CADA inicio
 * de sesión. La corrección vive acá — un comunicado ya cerrado deja de estar
 * pendiente, y sin pendiente el diálogo no se abre.
 */
describe('comunicadoVigente', () => {
  it('devuelve el primero del catálogo: hay un comunicado a la vez y es el último subido', () => {
    const catalogo = [anuncio({ id: 'nuevo' }), anuncio({ id: 'anterior' })];
    expect(comunicadoVigente(catalogo, HOY)?.id).toBe('nuevo');
  });

  it('saltea el que ya caducó y deja vigente al siguiente', () => {
    const catalogo = [anuncio({ id: 'vencido', vigenteHasta: '2026-08-31' }), anuncio({ id: 'siguiente' })];
    expect(comunicadoVigente(catalogo, HOY)?.id).toBe('siguiente');
  });

  it('el último día de vigencia todavía cuenta', () => {
    expect(comunicadoVigente([anuncio({ id: 'hoy', vigenteHasta: HOY })], HOY)?.id).toBe('hoy');
  });

  it('sin catálogo, o con todo vencido, no hay comunicado', () => {
    expect(comunicadoVigente([], HOY)).toBeUndefined();
    expect(comunicadoVigente([anuncio({ id: 'x', vigenteHasta: '2020-01-01' })], HOY)).toBeUndefined();
  });
});

describe('estaPendiente', () => {
  it('deja de estar pendiente una vez que el usuario lo cerró', () => {
    const pieza = anuncio({ id: 'comunicado-01' });

    expect(estaPendiente(pieza, [])).toBe(true);
    // Es la incidencia: con el id registrado, no vuelve en el próximo ingreso.
    expect(estaPendiente(pieza, ['comunicado-01'])).toBe(false);
  });

  it('un comunicado "fijo" insiste aunque se lo haya cerrado', () => {
    expect(estaPendiente(anuncio({ id: 'mantenimiento', fijo: true }), ['mantenimiento'])).toBe(true);
  });

  it('sin comunicado no hay nada pendiente', () => {
    expect(estaPendiente(undefined, [])).toBe(false);
  });

  it('los ids de otros comunicados no lo dan por visto', () => {
    expect(estaPendiente(anuncio({ id: 'actual' }), ['otro', 'viejo'])).toBe(true);
  });
});
