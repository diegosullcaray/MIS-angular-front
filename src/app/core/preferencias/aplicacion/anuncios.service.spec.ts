import { TestBed } from '@angular/core/testing';
import { AnunciosService } from './anuncios.service';
import { PreferenciasService } from './preferencias.service';
import { CATALOGO_ANUNCIOS } from '../dominio/anuncios.puerto';
import { REPOSITORIO_PREFERENCIAS } from '../dominio/repositorio-preferencias.puerto';
import { PreferenciasLocalStorageRepositorio } from '../infraestructura/preferencias-local-storage.repositorio';
import type { Anuncio } from '../dominio/anuncio.model';

const CATALOGO: readonly Anuncio[] = [
  { id: 'uno', titulo: 'Uno', cuerpo: '…', severidad: 'info', fecha: '2026-08-01' },
  { id: 'dos', titulo: 'Dos', cuerpo: '…', severidad: 'novedad', fecha: '2026-08-02' },
];

/**
 * Regresión de la incidencia: el diálogo de anuncios se abría en CADA inicio de
 * sesión. Ahora `abrirSiCorresponde()` es la única puerta y solo cede si queda
 * algo sin leer.
 */
describe('AnunciosService', () => {
  function crear(catalogo: readonly Anuncio[] = CATALOGO): AnunciosService {
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

  it('se abre la primera vez, porque hay anuncios sin leer', () => {
    const anuncios = crear();

    anuncios.abrirSiCorresponde();

    expect(anuncios.abierto()).toBe(true);
    expect(anuncios.pendientes()).toHaveLength(2);
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

  it('un anuncio NUEVO sí vuelve a abrirlo aunque los anteriores estén leídos', () => {
    const anuncios = crear();
    anuncios.abrirSiCorresponde();
    anuncios.cerrar();

    TestBed.resetTestingModule();
    const conNovedad = crear([
      ...CATALOGO,
      { id: 'tres', titulo: 'Tres', cuerpo: '…', severidad: 'alerta', fecha: '2026-08-30' },
    ]);
    conNovedad.abrirSiCorresponde();

    expect(conNovedad.abierto()).toBe(true);
    expect(conNovedad.pendientes().map((a) => a.id)).toEqual(['tres']);
  });

  it('silenciado no se abre ni habiendo anuncios sin leer', () => {
    const anuncios = crear();
    TestBed.inject(PreferenciasService).setSilenciarAnuncios(true);

    anuncios.abrirSiCorresponde();

    expect(anuncios.abierto()).toBe(false);
    // Silenciar no es marcar como leído: siguen pendientes para el historial.
    expect(anuncios.hayPendientes()).toBe(true);
  });

  it('silenciar() desde el diálogo lo apaga y lo cierra de una vez', () => {
    const anuncios = crear();
    anuncios.abrirSiCorresponde();

    anuncios.silenciar();

    expect(anuncios.abierto()).toBe(false);
    expect(TestBed.inject(PreferenciasService).anuncios().silenciar).toBe(true);
  });

  it('abrir() a pedido funciona aunque no quede nada pendiente', () => {
    const anuncios = crear();
    anuncios.abrirSiCorresponde();
    anuncios.cerrar();

    anuncios.abrir();

    expect(anuncios.abierto()).toBe(true);
    // El historial es lo que se ve cuando ya no hay novedades.
    expect(anuncios.historial()).toHaveLength(2);
  });

  it('sin catálogo no se abre nunca', () => {
    const anuncios = crear([]);
    anuncios.abrirSiCorresponde();

    expect(anuncios.abierto()).toBe(false);
  });
});
