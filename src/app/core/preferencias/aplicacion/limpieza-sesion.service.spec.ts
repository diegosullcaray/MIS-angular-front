import { TestBed } from '@angular/core/testing';
import { LimpiezaSesionService } from './limpieza-sesion.service';
import { PreferenciasService } from './preferencias.service';
import { AlmacenamientoNavegador } from '../infraestructura/almacenamiento-navegador';
import { REPOSITORIO_PREFERENCIAS } from '../dominio/repositorio-preferencias.puerto';
import { PreferenciasLocalStorageRepositorio, CLAVE_PREFERENCIAS } from '../infraestructura/preferencias-local-storage.repositorio';
import { PREFERENCIAS_POR_DEFECTO } from '../dominio/preferencias.model';

/**
 * El requisito era "limpio y exacto": al cerrar sesión no puede quedar nada del
 * usuario anterior en el equipo. Estos tests verifican que el borrado sea total
 * —no una lista de claves conocidas— y que ninguna parte que falle deje el
 * resto sin ejecutar.
 */
describe('LimpiezaSesionService', () => {
  function crear(): LimpiezaSesionService {
    TestBed.configureTestingModule({
      providers: [{ provide: REPOSITORIO_PREFERENCIAS, useExisting: PreferenciasLocalStorageRepositorio }],
    });
    return TestBed.inject(LimpiezaSesionService);
  }

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('vacía localStorage, sessionStorage y cookies, y devuelve el detalle', async () => {
    const limpieza = crear();
    TestBed.inject(PreferenciasService).setFondo('navy');
    localStorage.setItem('clave-de-otro-modulo', 'x');
    sessionStorage.setItem('mis.sesion', 'token');
    document.cookie = 'sesion=abc';

    const resultado = await limpieza.limpiarTodo();

    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).not.toContain('sesion=abc');
    expect(resultado.localStorage).toBe(true);
    expect(resultado.sessionStorage).toBe(true);
  });

  it('deja las preferencias en fábrica y SIN volver a escribirlas', async () => {
    const limpieza = crear();
    const preferencias = TestBed.inject(PreferenciasService);
    preferencias.setFondo('navy');
    preferencias.setAcento('#14b8a6');

    await limpieza.limpiarTodo();

    expect(preferencias.preferencias()).toEqual(PREFERENCIAS_POR_DEFECTO);
    // Si el reseteo persistiera, el siguiente usuario encontraría un archivo
    // de preferencias recién escrito por la sesión que se acaba de cerrar.
    expect(localStorage.getItem(CLAVE_PREFERENCIAS)).toBeNull();
    expect(localStorage.length).toBe(0);
  });

  it('si una parte del borrado falla, el resto igual se ejecuta', async () => {
    const limpieza = crear();
    const almacenamiento = TestBed.inject(AlmacenamientoNavegador);
    vi.spyOn(almacenamiento, 'limpiarLocalStorage').mockReturnValue(false);
    const cookies = vi.spyOn(almacenamiento, 'limpiarCookies');
    const caches = vi.spyOn(almacenamiento, 'limpiarCaches');
    const workers = vi.spyOn(almacenamiento, 'desregistrarServiceWorkers');

    const resultado = await limpieza.limpiarTodo();

    expect(resultado.localStorage).toBe(false);
    expect(cookies).toHaveBeenCalled();
    expect(caches).toHaveBeenCalled();
    expect(workers).toHaveBeenCalled();
  });

  it('espera al borrado asíncrono antes de resolver', async () => {
    const limpieza = crear();
    const almacenamiento = TestBed.inject(AlmacenamientoNavegador);
    let cachesResueltas = false;
    vi.spyOn(almacenamiento, 'limpiarCaches').mockImplementation(async () => {
      await Promise.resolve();
      cachesResueltas = true;
      return 3;
    });

    const resultado = await limpieza.limpiarTodo();

    // Sin el `await`, el cierre de sesión navegaría al login con la caché de la
    // PWA todavía llena.
    expect(cachesResueltas).toBe(true);
    expect(resultado.caches).toBe(3);
  });
});
