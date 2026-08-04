import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { HTTP_ERROR_FALLBACK, HTTP_ERROR_MESSAGES } from '../constants/http-error.constants';
import type { HttpErrorInfo, KnownHttpErrorCode } from '../interfaces/http-error.model';

/**
 * Punto único de traducción de errores HTTP → `HttpErrorInfo` mapeado.
 *
 * La usan tanto `httpErrorInterceptor` (para decidir si redirige a la
 * página de error de fullpages) como cualquier componente que prefiera
 * mostrar el error localmente (p. ej. con `InlineErrorComponent`).
 */
@Injectable({ providedIn: 'root' })
export class HttpErrorService {
  private readonly router = inject(Router);

  /** Resuelve el `HttpErrorInfo` mapeado para un status HTTP; usa el fallback si no está mapeado. */
  resolver(status: number): HttpErrorInfo {
    return HTTP_ERROR_MESSAGES[status as KnownHttpErrorCode] ?? { ...HTTP_ERROR_FALLBACK, code: status as KnownHttpErrorCode };
  }

  /** Extrae el status HTTP de un error de `HttpClient` (0 = sin red/CORS/timeout). */
  statusDe(error: unknown): number {
    return error instanceof HttpErrorResponse ? error.status : 0;
  }

  /** Navega a la página de error de fullpages (`/error/:code`) con el status resuelto. */
  async irAPaginaDeError(status: number): Promise<void> {
    await this.router.navigate(['/error', status]);
  }
}
