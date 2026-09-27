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

      if (info.esFatal) {
        httpError.irAPaginaDeError(status);
      }

      return throwError(() => error);
    }),
  );
};
