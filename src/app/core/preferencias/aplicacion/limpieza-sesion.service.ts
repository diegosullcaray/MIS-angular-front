import { Injectable, inject } from '@angular/core';
import { AlmacenamientoNavegador } from '../infraestructura/almacenamiento-navegador';
import type { ResultadoBorrado } from '../infraestructura/almacenamiento-navegador';
import { PreferenciasService } from './preferencias.service';
import { JerarquiaCacheService } from '../../../shared/ui/hier-selector/jerarquia-cache.service';

/** Caso de uso de limpieza de sesión. */
@Injectable({ providedIn: 'root' })
export class LimpiezaSesionService {
  private readonly almacenamiento = inject(AlmacenamientoNavegador);
  private readonly preferencias = inject(PreferenciasService);
  private readonly jerarquia = inject(JerarquiaCacheService);

  /** Vacía todo lo guardado en el navegador. */
  async limpiarTodo(): Promise<ResultadoBorrado> {
    const localStorageOk = this.almacenamiento.limpiarLocalStorage();
    const sessionStorageOk = this.almacenamiento.limpiarSessionStorage();
    const cookies = this.almacenamiento.limpiarCookies();

    const [caches] = await Promise.all([
      this.almacenamiento.limpiarCaches(),
      this.almacenamiento.desregistrarServiceWorkers(),
    ]);

    // El almacenamiento ya está vacío: `olvidar()` alinea la memoria con él sin
    // volver a escribir las preferencias que se acaban de borrar.
    this.preferencias.olvidar();

    // El caché de jerarquía vive en memoria, así que `localStorage.clear()` no
    // lo toca: el árbol que ve cada persona depende de quién es, y el cierre de
    // sesión no recarga la página.
    this.jerarquia.limpiar();

    return { localStorage: localStorageOk, sessionStorage: sessionStorageOk, cookies, caches };
  }
}
