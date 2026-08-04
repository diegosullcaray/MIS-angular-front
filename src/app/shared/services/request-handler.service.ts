// src/app/core/services/request-handler.service.ts

import { Injectable } from '@angular/core';
import { finalize, catchError, Observable, throwError, forkJoin } from 'rxjs';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root'
})
export class RequestHandlerService {

  constructor(
    private readonly loadingService: LoadingService
  ) { }

  /**
   * Maneja requests con loading automático
   * @param obs$ - Observable a ejecutar
   * @param loadingMessage - Mensaje opcional para mostrar
   */
  handle<T>(obs$: Observable<T>, loadingMessage?: string): Observable<T> {
    this.loadingService.show(loadingMessage);

    return obs$.pipe(
      finalize(() => this.loadingService.hide()),
      catchError((error) => {
        // En caso de error, asegurar que se oculte el loading
        this.loadingService.hide();
        return throwError(() => error);
      })
    );
  }

  /**
   * Maneja múltiples requests concurrentes usando forkJoin
   * @param requests - Array de observables a ejecutar
   * @param loadingMessage - Mensaje para mostrar durante la carga
   */
  handleMultiple<T>(requests: Observable<T>[], loadingMessage?: string): Observable<T[]> {
    if (requests.length === 0) {
      return new Observable(subscriber => {
        subscriber.next([]);
        subscriber.complete();
      });
    }

    this.loadingService.show(loadingMessage);

    return forkJoin(requests).pipe(
      finalize(() => this.loadingService.hide()),
      catchError((error) => {
        this.loadingService.hide();
        return throwError(() => error);
      })
    );
  }

  /**
   * Maneja requests con loading manual (sin auto-hide)
   * Útil cuando necesitas controlar manualmente cuándo ocultar el loading
   * @param obs$ - Observable a ejecutar
   * @param loadingMessage - Mensaje opcional para mostrar
   */
  handleManual<T>(obs$: Observable<T>, loadingMessage?: string): Observable<T> {
    this.loadingService.show(loadingMessage);
    return obs$;
  }
}
