import { Injectable, computed, signal } from '@angular/core';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  requestCount: number;
}

const INACTIVO: LoadingState = { isLoading: false, requestCount: 0 };

/** Spinner global: cuenta peticiones en vuelo. */
@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly estadoInterno = signal<LoadingState>(INACTIVO);

  readonly estado = this.estadoInterno.asReadonly();
  readonly cargando = computed(() => this.estadoInterno().isLoading);

  private requestCounter = 0;

  /** Muestra el spinner. */
  show(message?: string): void {
    this.requestCounter++;
    this.estadoInterno.set({
      isLoading: true,
      message,
      requestCount: this.requestCounter
    });
  }

  /** Oculta el spinner; solo cierra si no quedan peticiones pendientes. */
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

  /** Fuerza el cierre del spinner (errores). */
  forceHide(): void {
    this.requestCounter = 0;
    this.estadoInterno.set(INACTIVO);
  }
}
