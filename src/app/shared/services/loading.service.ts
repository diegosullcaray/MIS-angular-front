import { Injectable, computed, signal } from '@angular/core';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  requestCount: number;
}

const INACTIVO: LoadingState = { isLoading: false, requestCount: 0 };

/**
 * Spinner global: cuenta las peticiones en vuelo y se apaga cuando no queda
 * ninguna.
 *
 * El estado es un signal y NO un `BehaviorSubject`. La app corre en modo
 * zoneless (`provideZonelessChangeDetection`), donde una emisión de RxJS por
 * sí sola no marca ninguna vista para refresco: el overlay lo consumía con
 * `toSignal` y quedaba pintado aunque el estado ya fuera `isLoading: false`
 * —bloqueando toda la pantalla— cuando varias peticiones se resolvían juntas
 * durante el arranque. Un signal sí notifica al planificador de detección de
 * cambios, así que la vista se actualiza sola.
 */
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

  /**
   * Muestra el loading spinner
   * @param message - Mensaje opcional a mostrar
   */
  show(message?: string): void {
    this.requestCounter++;
    this.estadoInterno.set({
      isLoading: true,
      message,
      requestCount: this.requestCounter
    });
  }

  /**
   * Oculta el loading spinner
   * Solo oculta cuando no hay más requests pendientes
   */
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

  /**
   * Fuerza el ocultamiento del loading (útil para casos de error)
   */
  forceHide(): void {
    this.requestCounter = 0;
    this.estadoInterno.set(INACTIVO);
  }

  /**
   * Obtiene el estado actual del loading
   */
  get currentState(): LoadingState {
    return this.estadoInterno();
  }

  /**
   * Verifica si está cargando actualmente
   */
  get isLoading(): boolean {
    return this.estadoInterno().isLoading;
  }
}
