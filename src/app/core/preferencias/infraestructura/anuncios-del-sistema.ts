import type { Anuncio } from '../dominio/anuncio.model';

/**
 * El comunicado que hoy publica el Host: la imagen que está en
 * `src/assets/images/fc/ads`. Es la implementación del token
 * `CATALOGO_ANUNCIOS` mientras no exista el endpoint que los administre;
 * sustituirla por un servicio remoto es cambiar el `provide` en
 * `app.config.ts`, sin tocar el caso de uso ni el diálogo.
 *
 * Hay **un comunicado a la vez**. Publicar el siguiente es:
 *  1. dejar la imagen nueva en `assets/images/fc/ads`;
 *  2. agregar su entrada ARRIBA de esta lista, con un `id` nuevo y las medidas
 *     reales del archivo (`ancho`/`alto`: con ellas el navegador reserva el
 *     espacio y el diálogo no salta mientras carga).
 *
 * El `id` es la identidad anti-spam: un comunicado ya cerrado por el usuario no
 * vuelve a aparecer. Por eso reemplazar la imagen para corregir una errata NO
 * exige un id nuevo; querer que todos lo vuelvan a ver, sí.
 *
 * `vigenteHasta` es opcional y sirve para lo que caduca: pasada esa fecha el
 * comunicado deja de mostrarse y pasa a estar vigente el siguiente de la lista.
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
