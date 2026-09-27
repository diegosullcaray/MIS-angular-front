import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
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
  // La pantalla es la ruta sin query ni fragmento: pestañas y filtros no la cambian.
  const pantalla = inject(Router).url.split(/[?#]/)[0];
  const tanda = loading.iniciarPeticion(pantalla);
  return next(req).pipe(finalize(() => loading.terminarPeticion(tanda)));
};
