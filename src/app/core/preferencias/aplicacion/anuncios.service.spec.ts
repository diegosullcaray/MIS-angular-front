import { TestBed } from '@angular/core/testing';
import { AnunciosService } from './anuncios.service';
import { PreferenciasService } from './preferencias.service';
import { CATALOGO_ANUNCIOS } from '../dominio/anuncios.puerto';
import { REPOSITORIO_PREFERENCIAS } from '../dominio/repositorio-preferencias.puerto';
import { PreferenciasLocalStorageRepositorio } from '../infraestructura/preferencias-local-storage.repositorio';
import type { Anuncio } from '../dominio/anuncio.model';

function pieza(id: string, extra: Partial<Anuncio> = {}): Anuncio {
  return { id, imagen: `assets/images/fc/ads/${id}.png`, alt: id, ancho: 780, alto: 815, ...extra };
}

/**
 * Regresión de la incidencia: el diálogo de comunicados se abría en CADA inicio
 * de sesión. Ahora `abrirSiCorresponde()` es la única puerta y solo cede si el
 * comunicado vigente sigue sin leerse.
 */
describe('AnunciosService', () => {
  function crear(catalogo: readonly Anuncio[] = [pieza('comunicado-01')]): AnunciosService {
    TestBed.configureTestingModule({
      providers: [
        { provide: REPOSITORIO_PREFERENCIAS, useExisting: PreferenciasLocalStorageRepositorio },
        { provide: CATALOGO_ANUNCIOS, useValue: catalogo },
      ],
    });
    return TestBed.inject(AnunciosService);
  }

  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('se abre la primera vez, porque el comunicado está sin leer', () => {
    const anuncios = crear();

    anuncios.abrirSiCorresponde();

    expect(anuncios.abierto()).toBe(true);
    expect(anuncios.comunicado()?.id).toBe('comunicado-01');
  });

  it('tras cerrarlo NO vuelve a abrirse en el siguiente inicio de sesión', () => {
    const anuncios = crear();
    anuncios.abrirSiCorresponde();
    anuncios.cerrar();

    expect(anuncios.abierto()).toBe(false);
    expect(anuncios.hayPendientes()).toBe(false);

    // Otro arranque, con las mismas preferencias ya guardadas: nada que mostrar.
    TestBed.resetTestingModule();
    const siguienteSesion = crear();
    siguienteSesion.abrirSiCorresponde();

    expect(siguienteSesion.abierto()).toBe(false);
  });

  it('un comunicado NUEVO sí vuelve a abrirlo, aunque el anterior esté leído', () => {
    const anuncios = crear();
    anuncios.abrirSiCorresponde();
    anuncios.cerrar();

    // Publicar el siguiente es ponerlo arriba del catálogo.
    TestBed.resetTestingModule();
    const conNovedad = crear([pieza('comunicado-02'), pieza('comunicado-01')]);
    conNovedad.abrirSiCorresponde();

    expect(conNovedad.abierto()).toBe(true);
    expect(conNovedad.comunicado()?.id).toBe('comunicado-02');
  });

  it('el comunicado vigente es siempre el primero: el último que se subió', () => {
    const anuncios = crear([pieza('nuevo'), pieza('viejo')]);
    expect(anuncios.comunicado()?.id).toBe('nuevo');
  });

  it('silenciado no se abre ni con el comunicado sin leer', () => {
    const anuncios = crear();
    TestBed.inject(PreferenciasService).setSilenciarAnuncios(true);

    anuncios.abrirSiCorresponde();

    expect(anuncios.abierto()).toBe(false);
    // Silenciar no es marcar como leído: sigue pendiente para cuando se reactive.
    expect(anuncios.hayPendientes()).toBe(true);
  });

  it('silenciar() desde el diálogo lo apaga y lo cierra de una vez', () => {
    const anuncios = crear();
    anuncios.abrirSiCorresponde();

    anuncios.silenciar();

    expect(anuncios.abierto()).toBe(false);
    expect(TestBed.inject(PreferenciasService).anuncios().silenciar).toBe(true);
  });

  it('abrir() a pedido funciona aunque ya esté leído', () => {
    const anuncios = crear();
    anuncios.abrirSiCorresponde();
    anuncios.cerrar();

    anuncios.abrir();

    expect(anuncios.abierto()).toBe(true);
  });

  it('sin catálogo no se abre nunca', () => {
    const anuncios = crear([]);
    anuncios.abrirSiCorresponde();

    expect(anuncios.abierto()).toBe(false);
    expect(anuncios.comunicado()).toBeUndefined();
  });
});
