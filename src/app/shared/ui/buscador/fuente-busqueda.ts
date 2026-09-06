import { InjectionToken } from '@angular/core';
import type { FuenteBusqueda } from './buscador.model';

/**
 * Multi-token: cada módulo registra su fuente y aporta lo que tiene cargado,
 * sin que el buscador ni los demás módulos se enteren.
 *
 * Cada fuente filtra por permisos: solo devuelve lo que ese usuario puede abrir
 * (ver `FuenteNavegacionService`, que reusa el filtro de roles del explorador).
 */
export const FUENTE_BUSQUEDA = new InjectionToken<readonly FuenteBusqueda[]>('FUENTE_BUSQUEDA');
