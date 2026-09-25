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
 *   **carga independiente**. Una tanda de peticiones muestra el overlay hasta que responde la
 *   primera; desde ahí la pantalla ya tiene algo que mostrar y cada tabla que sigue esperando
 *   pinta su propio esqueleto. Así una consulta lenta no tapa las que ya llegaron.
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
  /** Si en la tanda de peticiones en curso ya respondió alguna. */
  private respondioAlguna = false;

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

  /** Una petición HTTP arranca. Si no había ninguna en vuelo, empieza una tanda nueva. */
  iniciarPeticion(): void {
    if (this.peticiones === 0) this.respondioAlguna = false;
    this.peticiones++;
    this.publicar();
  }

  /** Una petición HTTP terminó: con la primera respuesta de la tanda, el overlay se retira. */
  terminarPeticion(): void {
    this.peticiones = Math.max(0, this.peticiones - 1);
    this.respondioAlguna = true;
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
    const isLoading = this.manuales > 0 || (this.peticiones > 0 && !this.respondioAlguna);
    this.estadoInterno.set(
      isLoading
        ? { isLoading, requestCount, ...(this.mensaje ? { message: this.mensaje } : {}) }
        : { isLoading: false, requestCount },
    );
  }
}
