import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { HTTP_ERROR_IGNORED_URL_PATTERNS } from '../../pages/full-pages/error/constants';
import { HttpErrorService } from '../../pages/full-pages/error/services';

/**
 * Interceptor global de errores HTTP.
 * Redirige a la página de error del módulo `pages/full-pages/error` si `esFatal: true`.
 */
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
    })
  );
};
