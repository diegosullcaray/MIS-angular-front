import { InjectionToken } from '@angular/core';
import type { Anuncio } from './anuncio.model';

/**
 * Puerto de entrada del catálogo de anuncios. Se inyecta como token para que
 * la fuente sea sustituible: hoy es la constante `ANUNCIOS_DEL_SISTEMA` y
 * mañana puede ser un servicio que los traiga del backend, sin que el caso de
 * uso ni el diálogo se enteren.
 */
export const CATALOGO_ANUNCIOS = new InjectionToken<readonly Anuncio[]>('CATALOGO_ANUNCIOS', {
  providedIn: 'root',
  factory: () => [],
});
