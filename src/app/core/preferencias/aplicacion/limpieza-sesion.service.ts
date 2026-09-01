import { Injectable, inject } from '@angular/core';
import { AlmacenamientoNavegador } from '../infraestructura/almacenamiento-navegador';
import type { ResultadoBorrado } from '../infraestructura/almacenamiento-navegador';
import { PreferenciasService } from './preferencias.service';

/**
 * Caso de uso "cerrar sesión sin dejar rastro".
 *
 * En un equipo compartido —que es el caso de una agencia— el siguiente usuario
 * no debe encontrar nada del anterior: ni preferencias, ni sesión, ni la caché
 * de la PWA. Por eso el borrado es total y no una lista de claves conocidas:
 * `localStorage.clear()` en vez de `removeItem` uno por uno, así también se van
 * las claves que dejó cualquier módulo sin avisar.
 *
 * Es de mejor esfuerzo por diseño: cada paso falla en silencio y el resto
 * continúa. Un `localStorage` bloqueado no puede impedir que se vacíe la caché.
 */
@Injectable({ providedIn: 'root' })
export class LimpiezaSesionService {
  private readonly almacenamiento = inject(AlmacenamientoNavegador);
  private readonly preferencias = inject(PreferenciasService);

  /**
   * Vacía todo lo que el navegador guardó de esta sesión y devuelve la interfaz
   * a su estado de fábrica en memoria.
   *
   * Se espera a las partes asíncronas (cachés y service workers) para que el
   * cierre de sesión no navegue al login con el borrado a medias.
   */
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

    return { localStorage: localStorageOk, sessionStorage: sessionStorageOk, cookies, caches };
  }
}
