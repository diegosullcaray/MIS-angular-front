import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { LoadingService } from '../../shared/services/loading.service';

/**
 * Interceptor del spinner global para las peticiones HTTP (filtros, jerarquías, reportes).
 *
 * Carga independiente: el overlay cubre la pantalla hasta que responde la primera petición de la
 * tanda más reciente; las tablas que siguen esperando muestran su propio esqueleto (ver
 * `LoadingService`).
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  const tanda = loading.iniciarPeticion();
  return next(req).pipe(finalize(() => loading.terminarPeticion(tanda)));
};
