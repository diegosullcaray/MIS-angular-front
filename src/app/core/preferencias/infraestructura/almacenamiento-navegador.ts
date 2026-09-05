import { Injectable } from '@angular/core';

/** Qué se pudo borrar en un vaciado; lo consume el log de diagnóstico y los tests. */
export interface ResultadoBorrado {
  readonly localStorage: boolean;
  readonly sessionStorage: boolean;
  readonly cookies: number;
  readonly caches: number;
}

/** Adaptador de almacenamiento del navegador. */
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

  /** Caduca todas las cookies visibles desde JavaScript. */
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

  /** Borra las cachés de la Cache API. */
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

  /** Da de baja los service workers registrados. */
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
