import type { Anuncio } from '../dominio/anuncio.model';

/**
 * El comunicado vigente. Implementa `CATALOGO_ANUNCIOS` mientras no haya
 * endpoint que lo administre.
 *
 * Publicar el siguiente: dejar la imagen en `assets/images/fc/ads` y agregar su
 * entrada ARRIBA, con `id` nuevo y las medidas reales (evitan que el diálogo
 * salte al cargar). El `id` es la identidad anti-spam —uno ya cerrado no vuelve
 * a aparecer—, así que corregir una errata no pide id nuevo; querer que todos
 * lo vean otra vez, sí. `vigenteHasta` es opcional.
 */
export const ANUNCIOS_DEL_SISTEMA: readonly Anuncio[] = [
  {
    id: 'vinculacion-cartera-captaciones',
    imagen: 'assets/images/fc/ads/Comunicado.png',
    alt: 'Nuevos paneles: Vinculación de Cartera - Captaciones. Ruta: Menú Principal / Actividad Diaria / Captaciones / Vinculación de Cartera - Captaciones.',
    ancho: 780,
    alto: 815,
  },
] as const;
