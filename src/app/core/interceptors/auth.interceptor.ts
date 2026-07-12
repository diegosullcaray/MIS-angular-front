import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, Observable } from 'rxjs';
import { ShellStateService } from '../services/shell-state.service';
import { AuthService } from '../../pages/full-pages/auth/service/auth.service';

/**
 * Interceptor funcional de Autenticación.
 *
 * - Adjunta el token Bearer y el rol del usuario activo a cada petición.
 * - Ante un 401 del backend cierra la sesión y redirige al login.
 *
 * Registrado en app.config.ts:
 * ```typescript
 * provideHttpClient(withInterceptors([authInterceptor, fakeApiInterceptor]))
 * ```
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const shell = inject(ShellStateService);

  const token = auth.token();
  const usuario = shell.usuarioActivo();
  let authReq = req;

  // Los endpoints de login no llevan token
  const esLogin = req.url.includes('/auth/');

  if (token && usuario && !esLogin) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'X-User-Role': usuario.rol,
      },
    });
  }

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && !esLogin) {
        console.warn('[AuthInterceptor] Sesión no válida o expirada (401). Redirigiendo al login...');
        auth.cerrarSesion();
      }
      return throwError(() => error);
    })
  );
};
