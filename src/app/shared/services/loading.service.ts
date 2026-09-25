import { Injectable, computed, signal } from '@angular/core';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  requestCount: number;
}

const INACTIVO: LoadingState = { isLoading: false, requestCount: 0 };

/**
 * Spinner global.
 *
 * Distingue dos orígenes:
 * - `show()`/`hide()` manuales (guardar, operaciones que sí deben bloquear): el overlay queda
 *   hasta que se cierra la última.
 * - Peticiones HTTP (`iniciarPeticion()`/`terminarPeticion()`, las usa `loadingInterceptor`):
 *   **carga independiente**. Toda consulta nueva muestra el overlay, que se corta con la primera
 *   respuesta de esa misma consulta: desde ahí la sección ya tiene algo que mostrar y cada tabla
 *   que sigue esperando pinta su propio esqueleto. Así una consulta lenta no tapa las que ya
 *   llegaron, y una respuesta de una consulta anterior no corta el spinner de la nueva.
 */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly estadoInterno = signal<LoadingState>(INACTIVO);

  readonly estado = this.estadoInterno.asReadonly();
  readonly cargando = computed(() => this.estadoInterno().isLoading);

  private manuales = 0;
  private mensaje?: string;
  private peticiones = 0;
  /** Tanda más reciente: las peticiones que arrancan juntas (un reporte pide sus bloques a la vez). */
  private tanda = 0;
  /** Si la tanda actual todavía acepta peticiones: se cierra al terminar la tarea que la abrió. */
  private tandaAbierta = false;
  /** Si ya respondió alguna petición de la tanda más reciente. */
  private respondioLaTanda = false;

  /** Muestra el spinner. */
  show(message?: string): void {
    this.manuales++;
    this.mensaje = message;
    this.publicar();
  }

  /** Oculta el spinner; solo cierra si no quedan peticiones pendientes. */
  hide(): void {
    this.manuales = Math.max(0, this.manuales - 1);
    if (this.manuales === 0) this.mensaje = undefined;
    this.publicar();
  }

  /**
   * Una petición HTTP arranca y devuelve su tanda. Las que arrancan en la misma tarea (los bloques
   * de un reporte, pedidos a la vez) forman una tanda; la primera de una tanda nueva vuelve a
   * mostrar el overlay aunque sigan en vuelo peticiones anteriores.
   */
  iniciarPeticion(): number {
    if (!this.tandaAbierta) {
      this.tanda++;
      this.respondioLaTanda = false;
      this.tandaAbierta = true;
      queueMicrotask(() => (this.tandaAbierta = false));
    }
    this.peticiones++;
    this.publicar();
    return this.tanda;
  }

  /**
   * Una petición HTTP terminó. Solo una respuesta de la tanda más reciente retira el overlay: la
   * de una petición anterior (p. ej. las opciones del siguiente nivel de la jerarquía, que llegan
   * mientras el reporte recién arranca) no corta el spinner de la consulta nueva.
   */
  terminarPeticion(tanda = this.tanda): void {
    this.peticiones = Math.max(0, this.peticiones - 1);
    if (tanda === this.tanda) this.respondioLaTanda = true;
    this.publicar();
  }

  /** Fuerza el cierre del spinner (errores). */
  forceHide(): void {
    this.manuales = 0;
    this.peticiones = 0;
    this.mensaje = undefined;
    this.estadoInterno.set(INACTIVO);
  }

  private publicar(): void {
    const requestCount = this.manuales + this.peticiones;
    const isLoading = this.manuales > 0 || (this.peticiones > 0 && !this.respondioLaTanda);
    this.estadoInterno.set(
      isLoading
        ? { isLoading, requestCount, ...(this.mensaje ? { message: this.mensaje } : {}) }
        : { isLoading: false, requestCount },
    );
  }
}
