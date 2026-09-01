/**
 * Anuncios del sistema: los avisos que el Host muestra al entrar. El dominio
 * define QUÉ es un anuncio y CUÁNDO corresponde mostrarlo; de dónde salen
 * (una constante hoy, un endpoint mañana) lo decide el proveedor inyectado.
 */

export type SeveridadAnuncio = 'info' | 'novedad' | 'mantenimiento' | 'alerta';

export interface Anuncio {
  /**
   * Identidad estable del anuncio. Es la clave de la regla anti-spam: una vez
   * cerrado, este id queda marcado como visto y el aviso no vuelve. Cambiar el
   * texto sin cambiar el id NO lo revive — para eso se versiona el id.
   */
  readonly id: string;
  readonly titulo: string;
  readonly cuerpo: string;
  readonly severidad: SeveridadAnuncio;
  /** Fecha ISO (`YYYY-MM-DD`) de publicación; ordena la lista. */
  readonly fecha: string;
  /**
   * Un anuncio marcado como fijo se muestra aunque ya se haya visto: es para
   * avisos que tienen que estar delante del usuario mientras duren (una
   * ventana de mantenimiento, por ejemplo).
   */
  readonly fijo?: boolean;
  /** Último día en que tiene sentido mostrarlo (ISO). Sin él, no caduca. */
  readonly vigenteHasta?: string;
}

const ETIQUETAS: Record<SeveridadAnuncio, string> = {
  info: 'Información',
  novedad: 'Novedad',
  mantenimiento: 'Mantenimiento',
  alerta: 'Alerta',
};

export function etiquetaSeveridad(severidad: SeveridadAnuncio): string {
  return ETIQUETAS[severidad];
}

/** `severity` de PrimeNG con el que se pinta el `p-tag` de cada anuncio. */
export function severidadPrimeNg(severidad: SeveridadAnuncio): 'info' | 'success' | 'warn' | 'danger' {
  switch (severidad) {
    case 'novedad':
      return 'success';
    case 'mantenimiento':
      return 'warn';
    case 'alerta':
      return 'danger';
    default:
      return 'info';
  }
}

function vigente(anuncio: Anuncio, hoy: string): boolean {
  return anuncio.vigenteHasta === undefined || anuncio.vigenteHasta >= hoy;
}

/**
 * Los anuncios que corresponde mostrar. Es LA regla que arregla el spam: de
 * todo el catálogo solo pasan los vigentes que el usuario todavía no cerró
 * (más los `fijo`, que insisten a propósito). Con la lista de vistos al día,
 * el resultado es vacío y el diálogo no se abre.
 */
export function anunciosPendientes(
  catalogo: readonly Anuncio[],
  vistos: readonly string[],
  hoy: string,
): Anuncio[] {
  const yaVisto = new Set(vistos);

  return catalogo
    .filter((a) => vigente(a, hoy) && (a.fijo === true || !yaVisto.has(a.id)))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}
