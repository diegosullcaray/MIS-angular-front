import { anunciosPendientes, etiquetaSeveridad, severidadPrimeNg } from './anuncio.model';
import type { Anuncio } from './anuncio.model';

const HOY = '2026-09-01';

function anuncio(parcial: Partial<Anuncio> & Pick<Anuncio, 'id'>): Anuncio {
  return {
    titulo: 'Título',
    cuerpo: 'Cuerpo',
    severidad: 'info',
    fecha: '2026-08-01',
    ...parcial,
  };
}

/**
 * La incidencia era concreta: el diálogo de anuncios aparecía en CADA inicio de
 * sesión. La corrección vive acá — un anuncio ya cerrado deja de estar
 * pendiente, y sin pendientes el diálogo directamente no se abre.
 */
describe('anunciosPendientes', () => {
  it('un anuncio ya visto no vuelve a estar pendiente', () => {
    const catalogo = [anuncio({ id: 'a' }), anuncio({ id: 'b' })];

    expect(anunciosPendientes(catalogo, [], HOY).map((a) => a.id)).toEqual(['a', 'b']);
    expect(anunciosPendientes(catalogo, ['a'], HOY).map((a) => a.id)).toEqual(['b']);
    // Con todos vistos no queda nada: es el estado en el que el diálogo no sale.
    expect(anunciosPendientes(catalogo, ['a', 'b'], HOY)).toEqual([]);
  });

  it('un anuncio "fijo" insiste aunque se lo haya cerrado', () => {
    const catalogo = [anuncio({ id: 'mantenimiento', fijo: true })];
    expect(anunciosPendientes(catalogo, ['mantenimiento'], HOY)).toHaveLength(1);
  });

  it('un anuncio vencido no se muestra ni estando sin leer', () => {
    const catalogo = [
      anuncio({ id: 'vencido', vigenteHasta: '2026-08-31' }),
      anuncio({ id: 'ultimo-dia', vigenteHasta: HOY }),
      anuncio({ id: 'sin-caducidad' }),
    ];

    expect(anunciosPendientes(catalogo, [], HOY).map((a) => a.id).sort()).toEqual(['sin-caducidad', 'ultimo-dia']);
  });

  it('ordena del más nuevo al más viejo', () => {
    const catalogo = [
      anuncio({ id: 'viejo', fecha: '2026-01-01' }),
      anuncio({ id: 'nuevo', fecha: '2026-08-30' }),
      anuncio({ id: 'medio', fecha: '2026-05-05' }),
    ];

    expect(anunciosPendientes(catalogo, [], HOY).map((a) => a.id)).toEqual(['nuevo', 'medio', 'viejo']);
  });

  it('un catálogo vacío no rompe: simplemente no hay nada pendiente', () => {
    expect(anunciosPendientes([], ['a'], HOY)).toEqual([]);
  });
});

describe('severidades', () => {
  it('cada severidad tiene etiqueta y su equivalente de PrimeNG', () => {
    expect(etiquetaSeveridad('novedad')).toBe('Novedad');
    expect(severidadPrimeNg('novedad')).toBe('success');
    expect(severidadPrimeNg('mantenimiento')).toBe('warn');
    expect(severidadPrimeNg('alerta')).toBe('danger');
    expect(severidadPrimeNg('info')).toBe('info');
  });
});
