import { Injectable } from '@angular/core';

/** Qué se pudo borrar en un vaciado; lo consume el log de diagnóstico y los tests. */
export interface ResultadoBorrado {
  readonly localStorage: boolean;
  readonly sessionStorage: boolean;
  readonly cookies: number;
  readonly caches: number;
}

/**
 * Adaptador de todo lo que el navegador guarda por su cuenta.
 *
 * Existe para que el caso de uso de cierre de sesión no hable con
 * `localStorage`, `document.cookie` ni `caches` directamente: son cuatro APIs
 * distintas, cada una con su forma de fallar, y todas tienen que poder
 * fallar sin dejar el cierre de sesión a medias.
 */
@Injectable({ providedIn: 'root' })
export class AlmacenamientoNavegador {
  /** Vacía `localStorage` entero. */
  limpiarLocalStorage(): boolean {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  }

  /** Vacía `sessionStorage` entero. */
  limpiarSessionStorage(): boolean {
    try {
      sessionStorage.clear();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Caduca todas las cookies visibles desde JavaScript. Las `HttpOnly` no se
   * ven desde acá y solo las puede matar el backend — el borrado es de lo que
   * el navegador expone, no una garantía sobre la sesión del servidor.
   *
   * Se repite el vencimiento por cada prefijo del dominio y por cada nivel de
   * la ruta actual porque una cookie solo se borra desde el mismo `domain` y
   * `path` con los que se escribió; sin eso, quedan vivas las que se fijaron
   * en el dominio padre.
   */
  limpiarCookies(): number {
    try {
      const cookies = document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter(Boolean);
      if (cookies.length === 0) return 0;

      for (const nombre of cookies) {
        for (const dominio of this.dominios()) {
          for (const ruta of this.rutas()) {
            const alcance = dominio ? `; domain=${dominio}` : '';
            document.cookie = `${nombre}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${ruta}${alcance}`;
          }
        }
      }

      return cookies.length;
    } catch {
      return 0;
    }
  }

  /**
   * Borra las cachés de la Cache API — las que llena el service worker de la
   * PWA con el app-shell. Es asíncrono y de mejor esfuerzo: si el navegador no
   * expone `caches`, devuelve 0 en vez de fallar.
   */
  async limpiarCaches(): Promise<number> {
    try {
      if (typeof caches === 'undefined') return 0;

      const claves = await caches.keys();
      await Promise.all(claves.map((clave) => caches.delete(clave)));
      return claves.length;
    } catch {
      return 0;
    }
  }

  /**
   * Da de baja los service workers registrados. Sin esto, el worker anterior
   * sigue sirviendo el app-shell cacheado aunque las cachés estén vacías.
   */
  async desregistrarServiceWorkers(): Promise<number> {
    try {
      if (typeof navigator === 'undefined' || !navigator.serviceWorker?.getRegistrations) return 0;

      const registros = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registros.map((registro) => registro.unregister()));
      return registros.length;
    } catch {
      return 0;
    }
  }

  /** `['', '.host', '.dominio.tld']` — cada nivel desde el que pudo fijarse una cookie. */
  private dominios(): string[] {
    const host = location.hostname;
    if (!host || host === 'localhost') return [''];

    const partes = host.split('.');
    const dominios = [''];
    for (let i = 0; i < partes.length - 1; i++) {
      dominios.push(`.${partes.slice(i).join('.')}`);
    }
    return dominios;
  }

  /** `['/', '/app', '/app/dashboard']` — cada nivel de la ruta actual. */
  private rutas(): string[] {
    const segmentos = location.pathname.split('/').filter(Boolean);
    const rutas = ['/'];
    let acumulada = '';
    for (const segmento of segmentos) {
      acumulada += `/${segmento}`;
      rutas.push(acumulada);
    }
    return rutas;
  }
}
