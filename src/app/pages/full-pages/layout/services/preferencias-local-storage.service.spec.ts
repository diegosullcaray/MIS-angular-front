import { TestBed } from '@angular/core/testing';
import { CLAVE_PREFERENCIAS, PreferenciasLocalStorageRepositorio } from './preferencias-local-storage.service';
import { PREFERENCIAS_POR_DEFECTO } from '../interfaces/preferencias.model';

/**
 * El almacén de preferencias sobre `localStorage`.
 *
 * Lo que se prueba acá es que **nunca lanza**: la pantalla tiene que arrancar
 * igual con el almacenamiento bloqueado, lleno o con un JSON de otra versión.
 */
describe('PreferenciasLocalStorageRepositorio', () => {
  let repositorio: PreferenciasLocalStorageRepositorio;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    repositorio = TestBed.inject(PreferenciasLocalStorageRepositorio);
  });

  afterEach(() => localStorage.clear());

  it('sin nada guardado devuelve null, no un objeto a medias', () => {
    expect(repositorio.leer()).toBeNull();
  });

  it('guarda bajo una sola clave y lo recupera', () => {
    repositorio.guardar(PREFERENCIAS_POR_DEFECTO);

    expect(Object.keys(localStorage)).toEqual([CLAVE_PREFERENCIAS]);
    expect(repositorio.leer()).toEqual(PREFERENCIAS_POR_DEFECTO);
  });

  it('lo leído pasa por el saneamiento: un campo desconocido no llega a la aplicación', () => {
    localStorage.setItem(
      CLAVE_PREFERENCIAS,
      JSON.stringify({ apariencia: { tema: 'inventado' }, sobra: 'esto no existe' })
    );

    const leidas = repositorio.leer()!;

    expect(leidas.apariencia.tema).toBe(PREFERENCIAS_POR_DEFECTO.apariencia.tema);
    expect(leidas).not.toHaveProperty('sobra');
  });

  it('un JSON corrupto no rompe el arranque: se vuelve de fábrica', () => {
    localStorage.setItem(CLAVE_PREFERENCIAS, '{ esto no es json');

    expect(() => repositorio.leer()).not.toThrow();
    expect(repositorio.leer()).toBeNull();
  });

  it('limpiar() borra solo su clave', () => {
    localStorage.setItem('otra.cosa', 'intacta');
    repositorio.guardar(PREFERENCIAS_POR_DEFECTO);

    repositorio.limpiar();

    expect(repositorio.leer()).toBeNull();
    expect(localStorage.getItem('otra.cosa')).toBe('intacta');
  });

  // Modo privado o cuota llena: las preferencias siguen vivas en memoria.
  it('con el almacenamiento bloqueado ninguna operación lanza', () => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('QuotaExceededError');
    };

    try {
      expect(() => repositorio.guardar(PREFERENCIAS_POR_DEFECTO)).not.toThrow();
    } finally {
      Storage.prototype.setItem = original;
    }
  });
});
