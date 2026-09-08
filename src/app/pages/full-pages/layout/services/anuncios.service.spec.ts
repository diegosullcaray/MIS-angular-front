import { TestBed } from '@angular/core/testing';
import { AnunciosService } from './anuncios.service';
import { PreferenciasService } from './preferencias.service';
import { ComunicadosSesionService } from './comunicados-sesion.service';
import { CATALOGO_ANUNCIOS } from '../interfaces/anuncio.model';
import { REPOSITORIO_PREFERENCIAS } from '../interfaces/preferencias-almacen.model';
import { PreferenciasLocalStorageRepositorio } from './preferencias-local-storage.service';
import type { Anuncio } from '../interfaces/anuncio.model';

function pieza(id: string, extra: Partial<Anuncio> = {}): Anuncio {
  return { id, imagen: `assets/images/fc/ads/${id}.png`, alt: id, ancho: 780, alto: 815, ...extra };
}

/**
 * Dos reglas distintas, que antes eran una sola y por eso estaban mal:
 *
 * - `cerrar()` —"Entendido" y el clic fuera— calla el comunicado hasta la
 *   próxima sesión de navegación.
 * - `noMostrarEste()` lo calla para siempre, guardando su id en las
 *   preferencias.
 *
 * Sigue vigente la regresión que originó este servicio: `abrirSiCorresponde()`
 * es la única puerta al diálogo, y solo cede si el comunicado vigente está
 * pendiente por alguna de las dos vías.
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

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('se abre la primera vez, porque el comunicado está sin leer', () => {
    const anuncios = crear();

    anuncios.abrirSiCorresponde();

    expect(anuncios.abierto()).toBe(true);
    expect(anuncios.comunicado()?.id).toBe('comunicado-01');
  });

  it('cerrarlo lo calla en esta sesión: ni el diálogo ni el punto del header', () => {
    const anuncios = crear();
    anuncios.abrirSiCorresponde();
    anuncios.cerrar();

    expect(anuncios.abierto()).toBe(false);
    expect(anuncios.hayPendientes()).toBe(false);

    // Recargar la página no lo revive: `sessionStorage` sigue ahí.
    TestBed.resetTestingModule();
    const trasRecargar = crear();
    trasRecargar.abrirSiCorresponde();

    expect(trasRecargar.abierto()).toBe(false);
  });

  it('"Entendido" no persiste: en la próxima sesión el comunicado vuelve', () => {
    const anuncios = crear();
    anuncios.abrirSiCorresponde();
    anuncios.cerrar();

    expect(TestBed.inject(PreferenciasService).anuncios().vistos).toEqual([]);

    // Otra sesión de navegación: `sessionStorage` arranca vacío.
    sessionStorage.clear();
    TestBed.resetTestingModule();
    const siguienteSesion = crear();
    siguienteSesion.abrirSiCorresponde();

    expect(siguienteSesion.abierto()).toBe(true);
  });

  it('tras "No mostrar este comunicado" NO vuelve en el siguiente inicio de sesión', () => {
    const anuncios = crear();
    anuncios.abrirSiCorresponde();
    anuncios.noMostrarEste();

    expect(anuncios.abierto()).toBe(false);
    expect(TestBed.inject(PreferenciasService).anuncios().vistos).toEqual(['comunicado-01']);

    // Otro arranque, con las mismas preferencias ya guardadas: nada que mostrar.
    sessionStorage.clear();
    TestBed.resetTestingModule();
    const siguienteSesion = crear();
    siguienteSesion.abrirSiCorresponde();

    expect(siguienteSesion.abierto()).toBe(false);
  });

  it('un comunicado NUEVO sí vuelve a abrirlo, aunque el anterior esté leído', () => {
    const anuncios = crear();
    anuncios.abrirSiCorresponde();
    anuncios.noMostrarEste();

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

  it('noMostrarEste() lo guarda y lo cierra de una vez, sin apagar los demás', () => {
    const anuncios = crear();
    anuncios.abrirSiCorresponde();

    anuncios.noMostrarEste();

    expect(anuncios.abierto()).toBe(false);
    expect(TestBed.inject(PreferenciasService).anuncios().vistos).toEqual(['comunicado-01']);
    // El interruptor global es otra cosa y vive en Configuración.
    expect(TestBed.inject(PreferenciasService).anuncios().silenciar).toBe(false);
    expect(TestBed.inject(ComunicadosSesionService).yaLeido('comunicado-01')).toBe(true);
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
