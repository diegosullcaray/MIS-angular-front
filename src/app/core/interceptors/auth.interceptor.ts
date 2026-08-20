import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, Observable, timeout } from 'rxjs';
import { ShellStateService } from '../services/shell-state.service';
import { AuthService } from '../../pages/full-pages/auth/service/auth.service';
import { environment } from '../../../environments/environment';

/**
 * Interceptor funcional de Autenticación.
 *
 * ## Reglas
 * - **Rutas del backend Ant** (`requestConfigRootURL`, ej: `/cores2/ant`):
 *   NO llevan `Authorization: Bearer` — el protocolo Winder maneja su propia
 *   autenticación cifrada internamente. Se aplica un timeout de 30 s.
 * - **Rutas del backend REST del Host** (`/api/v1/*`):
 *   Adjuntan el token Bearer y el rol del usuario activo.
 * - **Rutas de login** (`/auth/`): no llevan token.
 * - Ante un 401 del backend Host cierra la sesión y redirige al login.
 *
 * Registrado en app.config.ts:
 * ```typescript
 * provideHttpClient(withInterceptors([authInterceptor]))
 * ```
 */

/** Timeout en ms para requests al backend Ant (igual que el STG). */
const ANT_TIMEOUT_MS = 30_000;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const shell = inject(ShellStateService);

  // ── ¿Es una petición al backend Ant? ─────────────────────────────────────
  const esRutaAnt = req.url.startsWith(environment.requestConfigRootURL);
  if (esRutaAnt) {
    // El protocolo Winder maneja su propia autenticación cifrada.
    // Solo aplicamos el timeout para evitar que un backend colgado
    // deje la UI esperando indefinidamente (igual que el STG).
    return next(req).pipe(timeout(ANT_TIMEOUT_MS));
  }

  // ── ¿Es una petición del cliente OAuth (Google)? ─────────────────────────
  // angular-oauth2-oidc también usa HttpClient (discovery document, etc.):
  // no debe llevar nuestro Bearer del Host ni disparar cerrarSesion() en un 401.
  if (req.url.startsWith('https://accounts.google.com')) {
    return next(req);
  }

  // ── Rutas del backend REST del Host (/api/v1/*) ──────────────────────────
  const token = auth.token();
  const usuario = shell.usuarioActivo();

  // Los endpoints de login no llevan token
  const esLogin = req.url.includes('/auth/');

  let authReq = req;
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
        auth.cerrarSesion();
      }
      return throwError(() => error);
    })
  );
};
