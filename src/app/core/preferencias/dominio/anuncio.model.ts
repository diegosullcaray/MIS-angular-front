/** Modelo del comunicado del sistema. */

/**
 * Una lámina del comunicado: la pieza gráfica que publica Comunicación Interna.
 * Un comunicado tiene una (lo habitual histórico) o varias, y en ese caso el
 * diálogo las recorre como carrusel.
 */
export interface LaminaAnuncio {
  /** Ruta de la imagen dentro de `assets`. */
  readonly imagen: string;
  /** Texto alternativo de la lámina. */
  readonly alt: string;
  /** Medidas reales del archivo: reservan el espacio y evitan el salto al cargar. */
  readonly ancho: number;
  readonly alto: number;
}

interface AnuncioComun {
  /** Identidad estable del comunicado. */
  readonly id: string;
  /** Si es fijo, se muestra aunque ya se haya cerrado. */
  readonly fijo?: boolean;
  /** Último día en que tiene sentido mostrarlo (ISO). Sin él, no caduca. */
  readonly vigenteHasta?: string;
}

/**
 * Comunicado de una sola lámina: los campos de la imagen van en la raíz.
 * Es la forma histórica, y se mantiene para no reescribir el catálogo cada vez
 * que se publica una pieza simple.
 */
export interface AnuncioSimple extends AnuncioComun, LaminaAnuncio {}

/** Comunicado de varias láminas. El diálogo lo muestra como carrusel. */
export interface AnuncioCarrusel extends AnuncioComun {
  /** Al menos una: un carrusel vacío no es un comunicado. */
  readonly laminas: readonly [LaminaAnuncio, ...LaminaAnuncio[]];
}

export type Anuncio = AnuncioSimple | AnuncioCarrusel;

/**
 * Las láminas del comunicado, siempre como lista.
 *
 * Normaliza las dos formas del catálogo para que el diálogo tenga un solo
 * camino: una lámina se recorre igual que diez, solo que sin controles. Sin
 * esta función, la vista tendría que preguntar por la forma del dato, que es
 * justo lo que el modelo debe resolver.
 */
export function laminasDe(anuncio: Anuncio): readonly LaminaAnuncio[] {
  return 'laminas' in anuncio ? anuncio.laminas : [anuncio];
}

function vigente(anuncio: Anuncio, hoy: string): boolean {
  return anuncio.vigenteHasta === undefined || anuncio.vigenteHasta >= hoy;
}

/** El comunicado vigente hoy, o `undefined` si no hay ninguno. */
export function comunicadoVigente(catalogo: readonly Anuncio[], hoy: string): Anuncio | undefined {
  return catalogo.find((a) => vigente(a, hoy));
}

/** Si todavía corresponde mostrar ese comunicado. */
export function estaPendiente(anuncio: Anuncio | undefined, vistos: readonly string[]): boolean {
  if (!anuncio) return false;
  return anuncio.fijo === true || !vistos.includes(anuncio.id);
}

/**
 * Índice de lámina acotado al catálogo.
 *
 * Recorrer es circular: desde la última, "siguiente" vuelve a la primera. Se
 * resuelve acá y no en el componente porque el módulo de un número negativo en
 * JavaScript es negativo (`-1 % 3 === -1`), y esa es exactamente la clase de
 * detalle que rompe el carrusel al presionar "anterior" en la primera lámina.
 */
export function laminaEnRango(indice: number, total: number): number {
  if (total <= 0) return 0;
  return ((indice % total) + total) % total;
}
