import { Injectable, computed, signal } from '@angular/core';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  requestCount: number;
}

const INACTIVO: LoadingState = { isLoading: false, requestCount: 0 };

/** Spinner global: cuenta las peticiones en vuelo. */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly estadoInterno = signal<LoadingState>(INACTIVO);

  /** Estado actual del spinner. Las vistas lo leen directo. */
  readonly estado = this.estadoInterno.asReadonly();

  /** Atajo para plantillas que solo necesitan saber si hay algo en vuelo. */
  readonly cargando = computed(() => this.estadoInterno().isLoading);

  private requestCounter = 0;

  /** Muestra el spinner, con un mensaje opcional. */
  show(message?: string): void {
    this.requestCounter++;
    this.estadoInterno.set({
      isLoading: true,
      message,
      requestCount: this.requestCounter
    });
  }

  /** Oculta el spinner, solo si no quedan peticiones pendientes. */
  hide(): void {
    this.requestCounter = Math.max(0, this.requestCounter - 1);

    if (this.requestCounter === 0) {
      this.estadoInterno.set(INACTIVO);
    } else {
      this.estadoInterno.set({
        isLoading: true,
        requestCount: this.requestCounter
      });
    }
  }

  /** Fuerza el ocultamiento del spinner (para casos de error). */
  forceHide(): void {
    this.requestCounter = 0;
    this.estadoInterno.set(INACTIVO);
  }

  /** Estado actual del spinner. */
  get currentState(): LoadingState {
    return this.estadoInterno();
  }

  /** True si hay algo en vuelo. */
  get isLoading(): boolean {
    return this.estadoInterno().isLoading;
  }
}
