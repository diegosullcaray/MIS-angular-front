import { InjectionToken } from '@angular/core';
import type { Preferencias } from './preferencias.model';

/**
 * Puerto de salida de las preferencias. La capa de aplicación solo conoce esta
 * interfaz; hoy la implementa `PreferenciasLocalStorageRepositorio` —el
 * "de momento en localStorage" del requerimiento— y mañana puede implementarla
 * un adaptador contra el backend sin tocar ni el dominio ni los casos de uso.
 *
 * Ninguna operación lanza: un almacenamiento no disponible (modo privado,
 * cuota llena) degrada a memoria, nunca rompe la pantalla.
 */
export interface RepositorioPreferencias {
  /** Preferencias guardadas, o `null` si todavía no hay ninguna. */
  leer(): Preferencias | null;
  guardar(preferencias: Preferencias): void;
  /** Borra lo guardado y deja al usuario en los valores de fábrica. */
  limpiar(): void;
}

/**
 * Implementación nula del puerto: recuerda dentro de la propia instancia y nada
 * más. Es el valor por defecto del token para que la aplicación nunca dependa
 * de que exista un almacenamiento — en un test, o en un render sin `window`,
 * las preferencias funcionan igual, solo no sobreviven.
 */
class RepositorioPreferenciasEnMemoria implements RepositorioPreferencias {
  private guardadas: Preferencias | null = null;

  leer(): Preferencias | null {
    return this.guardadas;
  }

  guardar(preferencias: Preferencias): void {
    this.guardadas = preferencias;
  }

  limpiar(): void {
    this.guardadas = null;
  }
}

export const REPOSITORIO_PREFERENCIAS = new InjectionToken<RepositorioPreferencias>('REPOSITORIO_PREFERENCIAS', {
  providedIn: 'root',
  // El adaptador real (`localStorage`) lo enchufa `app.config.ts`; acá solo se
  // garantiza que inyectar el puerto nunca falle por falta de proveedor.
  factory: () => new RepositorioPreferenciasEnMemoria(),
});
