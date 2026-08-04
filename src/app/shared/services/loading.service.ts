import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface LoadingState {
  isLoading: boolean;
  message?: string;
  requestCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly loadingSubject = new BehaviorSubject<LoadingState>({
    isLoading: false,
    requestCount: 0
  });

  readonly loading$ = this.loadingSubject.asObservable();
  private requestCounter = 0;

  /**
   * Muestra el loading spinner
   * @param message - Mensaje opcional a mostrar
   */
  show(message?: string): void {
    this.requestCounter++;
    this.loadingSubject.next({
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
      this.loadingSubject.next({
        isLoading: false,
        requestCount: 0
      });
    } else {
      this.loadingSubject.next({
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
    this.loadingSubject.next({
      isLoading: false,
      requestCount: 0
    });
  }

  /**
   * Obtiene el estado actual del loading
   */
  get currentState(): LoadingState {
    return this.loadingSubject.value;
  }

  /**
   * Verifica si está cargando actualmente
   */
  get isLoading(): boolean {
    return this.loadingSubject.value.isLoading;
  }
}
