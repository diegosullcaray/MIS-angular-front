import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, Observable } from 'rxjs';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import { AuthService } from '../service/auth.service';
import { ANT_ROOT_URL } from '../../../../core/winder/rest/ant-endpoint.constantes';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const shell = inject(ShellStateService);

  // El protocolo Winder cifra su propia autenticación: la request va tal cual.
  //
  // Sin timeout, a propósito. El STG original no impone ninguno, y varios
  // reportes de data masiva tardan legítimamente más que cualquier límite que
  // se elija: recortarlos convertía una consulta lenta en una pantalla vacía.
  // Quien manda es el backend; si la consulta muere, muere con su error.
  if (req.url.startsWith(ANT_ROOT_URL)) {
    return next(req);
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
    }),
  );
};
