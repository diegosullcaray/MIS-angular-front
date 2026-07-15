import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import type { Observable } from 'rxjs';
import { ShellContractService } from '../shell-contract/shell-contract.service';

/**
 * Interceptor de autenticación del REMOTE.
 *
 * Adjunta el JWT emitido por el Host (leído del contrato de la shell) a las
 * peticiones del backend PROPIO del subsistema (prefijo /api/<dominio>/v1/*).
 * El backend hijo valida firma, expiración y el claim `subsistemas` (guía 08 §5.2).
 *
 * ⚠️ El remote NUNCA llama a las APIs del Host (/api/v1/*) — RN-02.
 */
export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const shell = inject(ShellContractService);

  const token = shell.token();
  const usuario = shell.usuarioActivo();

  if (token && usuario) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'X-User-Role': usuario.rol,
      },
    });
  }

  return next(req);
};
