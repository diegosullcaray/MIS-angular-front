import { Injectable, signal } from '@angular/core';

/** Comunicados dados por leídos en la sesión de navegación en curso. */
export const CLAVE_COMUNICADOS_SESION = 'mis.comunicados.sesion';

/**
 * Los comunicados que el usuario cerró con "Entendido" en ESTA sesión.
 *
 * Es la mitad efímera de la regla: "Entendido" calla el comunicado mientras dure
 * la navegación, y "No mostrar este comunicado" lo calla para siempre —eso
 * último vive en `PreferenciasService`, sobre `localStorage`.
 *
 * Va en `sessionStorage` y no en una señal suelta por una razón concreta: con
 * la señal, recargar la página (F5) volvería a levantar el aviso, que es
 * justamente lo que "Entendido" acaba de decir que no quiere. `sessionStorage`
 * muere con la pestaña y con el cierre de sesión —que lo vacía—, así que la
 * próxima entrada vuelve a mostrarlo, como pide la incidencia.
 */
@Injectable({ providedIn: 'root' })
export class ComunicadosSesionService {
  private readonly _leidos = signal<readonly string[]>(this.leerDelAlmacen());

  /** Ids leídos en esta sesión. Es señal para que el punto del header reaccione. */
  readonly leidos = this._leidos.asReadonly();

  /** `true` si el comunicado ya se cerró en esta sesión. */
  yaLeido(id: string): boolean {
    return this.leidos().includes(id);
  }

  marcar(id: string): void {
    if (!id || this.yaLeido(id)) return;

    const siguiente = [...this._leidos(), id];
    this._leidos.set(siguiente);
    this.guardar(siguiente);
  }

  private leerDelAlmacen(): readonly string[] {
    try {
      const crudo = sessionStorage.getItem(CLAVE_COMUNICADOS_SESION);
      if (!crudo) return [];
      const datos: unknown = JSON.parse(crudo);
      return Array.isArray(datos) ? datos.filter((id): id is string => typeof id === 'string') : [];
    } catch {
      // JSON inválido o almacenamiento bloqueado: se arranca sin nada leído.
      return [];
    }
  }

  private guardar(ids: readonly string[]): void {
    try {
      sessionStorage.setItem(CLAVE_COMUNICADOS_SESION, JSON.stringify(ids));
    } catch {
      // Modo privado o cuota llena: la lista sigue viva en memoria durante la
      // sesión, solo no sobrevive a la recarga.
    }
  }
}
