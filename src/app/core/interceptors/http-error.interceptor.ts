import { HttpContextToken, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, throwError } from 'rxjs';
import { HTTP_ERROR_IGNORED_URL_PATTERNS } from '../constants/http-error.constants';
import { HttpErrorService } from '../services/http-error.service';

/**
 * Marca una petición para que `httpErrorInterceptor` **no** redirija a la
 * página de error global aunque el status sea fatal (ej. llamadas de fondo
 * como la carga del menú del sidebar, donde un error no debe sacar al
 * usuario de la vista en la que está).
 *
 * Uso: `http.get(url, { context: new HttpContext().set(SKIP_GLOBAL_HTTP_ERROR, true) })`
 */
export const SKIP_GLOBAL_HTTP_ERROR = new HttpContextToken<boolean>(() => false);

/**
 * Interceptor funcional de errores HTTP — mapea errores conocidos
 * (`http-error.constants.ts`) y redirige a la página de error de
 * `pages/full-pages/error` **solo** para errores fatales de infraestructura
 * (backend caído, timeout, sin red — ver `esFatal` en `HttpErrorInfo`).
 *
 * Errores de negocio/validación (400/404/409/422, etc.) se re-lanzan tal
 * cual para que cada componente los maneje localmente (`InlineErrorComponent`,
 * toasts) — este interceptor nunca los oculta.
 *
 * Registrado en `app.config.ts` junto a `authInterceptor`.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const router = inject(Router);
  const httpErrorService = inject(HttpErrorService);

  const ignorada = HTTP_ERROR_IGNORED_URL_PATTERNS.some((patron) => req.url.includes(patron));
  const omitirGlobal = req.context.get(SKIP_GLOBAL_HTTP_ERROR);

  if (ignorada || omitirGlobal) {
    return next(req);
  }

  return next(req).pipe(
    catchError((error: unknown) => {
      const status = httpErrorService.statusDe(error);
      const info = httpErrorService.resolver(status);

      // 401 ya lo maneja authInterceptor (cierra sesión + redirige a /login).
      if (info.esFatal && status !== 401) {
        void router.navigate(['/error', status || 0]);
      }

      return throwError(() => error);
    })
  );
};
