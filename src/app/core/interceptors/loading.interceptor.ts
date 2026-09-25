import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { LoadingService } from '../../shared/services/loading.service';

/**
 * Interceptor del spinner global para las peticiones HTTP (filtros, jerarquías, reportes).
 *
 * Carga independiente: el overlay cubre la pantalla solo hasta que responde la primera petición
 * de la tanda; las tablas que siguen esperando muestran su propio esqueleto (ver `LoadingService`).
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  loading.iniciarPeticion();
  return next(req).pipe(finalize(() => loading.terminarPeticion()));
};
