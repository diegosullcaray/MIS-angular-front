/**
 * El comunicado del sistema: el aviso que el Host muestra al entrar.
 *
 * Un comunicado ES una imagen —las piezas que publica Comunicación Interna ya
 * vienen diseñadas y armadas en `assets/images/fc/ads`—, no un título con un
 * cuerpo de texto. Y hay **uno solo a la vez**: publicar el siguiente es
 * reemplazar la pieza, no acumular una lista que el usuario tenga que recorrer.
 *
 * El dominio define qué es un comunicado y cuándo corresponde mostrarlo; de
 * dónde sale lo decide el proveedor inyectado (`CATALOGO_ANUNCIOS`).
 */

export interface Anuncio {
  /**
   * Identidad estable del comunicado. Es la clave de la regla anti-spam: una
   * vez cerrado, este id queda marcado como visto y la pieza no vuelve.
   * Reemplazar la imagen sin cambiar el id NO lo revive — para eso se versiona.
   */
  readonly id: string;
  /** Ruta de la imagen dentro de `assets`. */
  readonly imagen: string;
  /**
   * Qué dice el comunicado. Es lo único que llega a un lector de pantalla y
   * también el nombre con el que se lo identifica en Configuración.
   */
  readonly alt: string;
  /**
   * Medidas reales del archivo. Se publican en el `<img>` para que el navegador
   * reserve el espacio y el diálogo no salte de tamaño mientras carga.
   */
  readonly ancho: number;
  readonly alto: number;
  /**
   * Un comunicado marcado como fijo se muestra aunque ya se haya cerrado: es
   * para avisos que tienen que estar delante del usuario mientras duren.
   */
  readonly fijo?: boolean;
  /** Último día en que tiene sentido mostrarlo (ISO). Sin él, no caduca. */
  readonly vigenteHasta?: string;
}

function vigente(anuncio: Anuncio, hoy: string): boolean {
  return anuncio.vigenteHasta === undefined || anuncio.vigenteHasta >= hoy;
}

/**
 * El comunicado que está publicado hoy, o `undefined` si no hay ninguno.
 *
 * El catálogo llega como lista solo para que reemplazar la pieza sea agregar la
 * nueva arriba en vez de pisar la anterior: el vigente es el PRIMERO que no
 * haya caducado, así "lo último que se subió" es siempre lo que se ve.
 */
export function comunicadoVigente(catalogo: readonly Anuncio[], hoy: string): Anuncio | undefined {
  return catalogo.find((a) => vigente(a, hoy));
}

/**
 * Si todavía corresponde mostrar ese comunicado.
 *
 * Es LA regla que arregla el spam: una vez que el usuario lo cerró, su id queda
 * en la lista de vistos y deja de estar pendiente — salvo que sea `fijo`, que
 * insiste a propósito. Sin nada pendiente, el diálogo no se abre.
 */
export function estaPendiente(anuncio: Anuncio | undefined, vistos: readonly string[]): boolean {
  if (!anuncio) return false;
  return anuncio.fijo === true || !vistos.includes(anuncio.id);
}
