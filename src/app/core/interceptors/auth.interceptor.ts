import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, Observable } from 'rxjs';
import { ShellStateService } from '../services/shell-state.service';

/**
 * Interceptor funcional de Autenticación (Angular 22).
 *
 * - Injecta el token/headers a las llamadas de API si hay sesión.
 * - Captura errores HTTP globales (ej: 401 Unauthorized → redirige al login).
 *
 * Se configura en el app.config.ts usando:
 * ```typescript
 * provideHttpClient(withInterceptors([authInterceptor]))
 * ```
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const shell  = inject(ShellStateService);
  const router = inject(Router);

  // Obtener usuario activo
  const usuario = shell.usuarioActivo();
  let authReq = req;

  // Si hay un usuario activo, simulamos adjuntar un token Bearer
  if (usuario) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer mock-token-for-${usuario.id}`,
        'X-User-Role': usuario.rol,
      },
    });
  }

  // Continuar petición y manejar errores
  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        // Si el servidor responde 401, cerramos la sesión y enviamos al login
        if (error.status === 401) {
          console.warn('[AuthInterceptor] Sesión no válida o expirada (401). Redirigiendo al login...');
          shell.cerrarSesion();
          router.navigate(['/login']);
        }
      }
      return throwError(() => error);
    })
  );
};
