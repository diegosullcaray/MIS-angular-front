import {
  HttpContextToken,
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, Observable, timeout } from 'rxjs';
import { ShellStateService } from '../services/shell-state.service';
import { AuthService } from '../../pages/full-pages/auth/service/auth.service';
import { environment } from '../../../environments/environment';

/** Timeout en ms para requests al backend Ant (igual que el STG). */
const ANT_TIMEOUT_MS = 30_000;

/**
 * Timeout propio de una request, en ms.
 *
 * Existe porque unos pocos reportes mueven tanta data que no entran en los 30 s
 * por defecto ("Seguimiento Reprogramados", "Seguimiento de Portafolio"). Subir
 * el global para todos sería peor: dejaría a la app esperando el doble ante
 * cualquier request realmente colgada. Así solo esperan de más los que lo piden.
 */
export const TIMEOUT_MS = new HttpContextToken<number>(() => ANT_TIMEOUT_MS);

/** Timeout de los reportes de data masiva. */
export const TIMEOUT_REPORTE_PESADO_MS = 120_000;

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const shell = inject(ShellStateService);

  // El protocolo Winder cifra su propia autenticación: solo se le pone timeout.
  if (req.url.startsWith(environment.requestConfigRootURL)) {
    return next(req).pipe(timeout(req.context.get(TIMEOUT_MS)));
  }

  // angular-oauth2-oidc usa HttpClient: no debe llevar el Bearer del Host ni cerrar sesión en un 401.
  if (req.url.startsWith('https://accounts.google.com')) {
    return next(req);
  }

  const token = auth.token();
  const usuario = shell.usuarioActivo();
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
        void auth.cerrarSesion();
      }
      return throwError(() => error);
    })
  );
};
