import { TestBed } from '@angular/core/testing';
import { AlmacenamientoNavegador } from './almacenamiento-navegador';

describe('AlmacenamientoNavegador', () => {
  let almacenamiento: AlmacenamientoNavegador;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    almacenamiento = TestBed.inject(AlmacenamientoNavegador);
    localStorage.clear();
    sessionStorage.clear();
  });

  it('vacía localStorage y sessionStorage por completo, no clave por clave', () => {
    localStorage.setItem('mis.preferencias', '{}');
    localStorage.setItem('una-clave-de-otro-modulo', 'x');
    sessionStorage.setItem('mis.sesion', 'token');

    expect(almacenamiento.limpiarLocalStorage()).toBe(true);
    expect(almacenamiento.limpiarSessionStorage()).toBe(true);

    // Lo importante es que también se vaya lo que este código no conoce: si el
    // borrado fuera una lista de claves, esa segunda clave sobreviviría.
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('cuenta y caduca las cookies visibles desde JavaScript', () => {
    document.cookie = 'sesion=abc';
    document.cookie = 'preferencia=1';

    expect(almacenamiento.limpiarCookies()).toBe(2);
    expect(document.cookie).not.toContain('sesion=abc');
    expect(document.cookie).not.toContain('preferencia=1');
  });

  it('sin cookies no hace nada y devuelve 0', () => {
    for (const c of document.cookie.split(';').map((x) => x.split('=')[0].trim()).filter(Boolean)) {
      document.cookie = `${c}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }

    expect(almacenamiento.limpiarCookies()).toBe(0);
  });

  it('sin Cache API ni service workers devuelve 0 en vez de fallar', async () => {
    // Es el caso de jsdom, y también el de un navegador sin soporte: el cierre
    // de sesión no puede quedarse trabado por una API que no existe.
    await expect(almacenamiento.limpiarCaches()).resolves.toBe(0);
    await expect(almacenamiento.desregistrarServiceWorkers()).resolves.toBe(0);
  });

  it('un almacenamiento bloqueado devuelve false sin lanzar', () => {
    const original = Storage.prototype.clear;
    Storage.prototype.clear = () => {
      throw new Error('QuotaExceededError');
    };

    try {
      expect(almacenamiento.limpiarLocalStorage()).toBe(false);
      expect(almacenamiento.limpiarSessionStorage()).toBe(false);
    } finally {
      Storage.prototype.clear = original;
    }
  });
});
