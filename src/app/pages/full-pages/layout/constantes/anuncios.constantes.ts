import type { Anuncio } from '../interfaces/anuncio.model';

/**
 * El comunicado vigente. Implementa `CATALOGO_ANUNCIOS` mientras no haya
 * endpoint que lo administre.
 *
 * Publicar el siguiente: dejar las imágenes en `assets/images/fc/ads` y agregar
 * su entrada ARRIBA, con `id` nuevo y las medidas reales (evitan que el diálogo
 * salte al cargar). El `id` es la identidad anti-spam —uno ya cerrado no vuelve
 * a aparecer—, así que corregir una errata no pide id nuevo; querer que todos
 * lo vean otra vez, sí. `vigenteHasta` es opcional.
 *
 * Hay dos formas, y el diálogo las trata igual:
 *
 *   Una lámina — los campos de la imagen van en la raíz:
 *     { id: 'x', imagen: '…/pieza.png', alt: '…', ancho: 780, alto: 815 }
 *
 *   Varias láminas — el diálogo las recorre como carrusel, en este orden:
 *     {
 *       id: 'x',
 *       laminas: [
 *         { imagen: '…/pieza-1.png', alt: '…', ancho: 780, alto: 815 },
 *         { imagen: '…/pieza-2.png', alt: '…', ancho: 780, alto: 815 },
 *       ],
 *     }
 *
 * El `alt` se escribe por lámina y describe LO QUE DICE la pieza, no que es una
 * imagen: es el único acceso al comunicado para quien usa lector de pantalla.
 */
export const ANUNCIOS_DEL_SISTEMA: readonly Anuncio[] = [
  {
    // El identificador nuevo hace que quienes cerraron el comunicado anterior
    // reciban también estas dos láminas.
    id: 'comunicados-vinculacion-cartera-y-consulta-fen',
    laminas: [
      {
        imagen: 'assets/images/fc/ads/Comunicado1.png',
        alt: 'Nuevos paneles: Vinculación de Cartera - Captaciones. Ruta: Menú Principal, Actividad Diaria, Captaciones, Vinculación de Cartera - Captaciones.',
        ancho: 780,
        alto: 815,
      },
      {
        imagen: 'assets/images/fc/ads/Comunicado2.png',
        alt: 'Consulta FEN - CENEPRED para toda la red. Recuerda consultar el nivel de exposición territorial antes de completar la evaluación en la matriz de riesgos por distrito.',
        ancho: 2100,
        alto: 2016,
      },
    ],
  },
] as const;
