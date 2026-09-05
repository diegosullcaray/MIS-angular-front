/** Modelo del comunicado del sistema. */


export interface Anuncio {
  /** Identidad estable del comunicado. */
  readonly id: string;
  /** Ruta de la imagen dentro de `assets`. */
  readonly imagen: string;
  /** Texto alternativo del comunicado. */
  readonly alt: string;
  /** Ancho de la imagen. */
  readonly ancho: number;
  readonly alto: number;
  /** Si es fijo, se muestra aunque ya se haya cerrado. */
  readonly fijo?: boolean;
  /** Último día en que tiene sentido mostrarlo (ISO). Sin él, no caduca. */
  readonly vigenteHasta?: string;
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
