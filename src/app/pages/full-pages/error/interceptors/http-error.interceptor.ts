import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { HttpErrorService } from '../services/http-error.service';
import { HTTP_ERROR_IGNORED_URL_PATTERNS } from '../constantes/http-error.constantes';

/** Interceptor global: redirige a `/error/:code` cuando el error resuelto es `esFatal`. */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const httpError = inject(HttpErrorService);

  const ignorar = HTTP_ERROR_IGNORED_URL_PATTERNS.some((patron) => req.url.includes(patron));
  if (ignorar) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      const status = httpError.statusDe(error);
      const info = httpError.resolver(status);

      // Status 0 con red disponible = request abortada por la navegación (p. ej. al volver
      // de un reporte), no una caída real: que lo muestre la pantalla, no `/error/0`.
      const abortada = status === 0 && navigator.onLine;

      if (info.esFatal && !abortada) {
        httpError.irAPaginaDeError(status);
      }

      return throwError(() => error);
    }),
  );
};
