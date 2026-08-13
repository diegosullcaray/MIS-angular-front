import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { LoadingService } from '../../shared/services/loading.service';

/**
 * Interceptor que muestra el spinner global de `LoadingService`
 * durante cualquier petición HTTP activa (filtros, jerarquías, reportes).
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loading = inject(LoadingService);
  loading.show();
  return next(req).pipe(
    finalize(() => {
      loading.hide();
    })
  );
};
