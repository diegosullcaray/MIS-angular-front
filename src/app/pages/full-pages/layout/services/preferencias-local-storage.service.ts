import { Injectable } from '@angular/core';
import { sanearPreferencias } from '../interfaces/preferencias.model';
import type { Preferencias } from '../interfaces/preferencias.model';
import type { RepositorioPreferencias } from '../interfaces/preferencias-almacen.model';

/** Única clave de `localStorage` con preferencias: todo va en un solo documento JSON. */
export const CLAVE_PREFERENCIAS = 'mis.preferencias';

/**
 * Implementación de `RepositorioPreferencias` sobre `localStorage`.
 *
 * Guarda el árbol completo bajo una sola clave en vez de una por ajuste: así
 * el borrado de sesión tiene un único objetivo, y lo leído pasa siempre por
 * `sanearPreferencias`, que es quien garantiza que un JSON viejo o corrupto no
 * llegue a la aplicación.
 */
@Injectable({ providedIn: 'root' })
export class PreferenciasLocalStorageRepositorio implements RepositorioPreferencias {
  leer(): Preferencias | null {
    try {
      const crudo = localStorage.getItem(CLAVE_PREFERENCIAS);
      if (!crudo) return null;
      return sanearPreferencias(JSON.parse(crudo));
    } catch {
      // JSON inválido o almacenamiento bloqueado: se arranca de fábrica.
      return null;
    }
  }

  guardar(preferencias: Preferencias): void {
    try {
      localStorage.setItem(CLAVE_PREFERENCIAS, JSON.stringify(preferencias));
    } catch {
      // Modo privado o cuota llena: las preferencias siguen vivas en memoria
      // durante la sesión, solo no sobreviven a la recarga.
    }
  }

  limpiar(): void {
    try {
      localStorage.removeItem(CLAVE_PREFERENCIAS);
    } catch {
      // Nada que hacer: si no se puede escribir, tampoco había nada guardado.
    }
  }
}
