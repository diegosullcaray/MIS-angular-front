import { InjectionToken } from '@angular/core';
import type { FuenteBusqueda } from './buscador.model';

/**
 * Fuentes que alimentan el buscador. Es un multi-token: cada módulo registra la
 * suya y aporta la data que tiene cargada, sin que el buscador —ni los demás
 * módulos— tengan que enterarse.
 *
 * ```typescript
 * // en los providers de la app
 * { provide: FUENTE_BUSQUEDA, useExisting: FuenteDashboardsService, multi: true }
 * ```
 *
 * Cada fuente es responsable de respetar los permisos del usuario: solo debe
 * devolver lo que ese usuario puede abrir (ver `FuenteNavegacionService`, que
 * reusa el filtro de roles del explorador).
 */
export const FUENTE_BUSQUEDA = new InjectionToken<readonly FuenteBusqueda[]>('FUENTE_BUSQUEDA');
