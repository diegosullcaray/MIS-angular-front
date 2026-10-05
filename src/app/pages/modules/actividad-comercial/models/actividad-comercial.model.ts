/**
 * Contratos del módulo Actividad Comercial.
 *
 * Se mantienen separados el payload crudo del backend y el modelo que consume
 * la pantalla: renombrar una columna en Ant no debe obligar a tocar la vista.
 */

/** EJEMPLO pendiente de adaptar: cod/des/mto/est no son campos verificados del reporte. */
export interface ActividadComercialFilaDto {
  readonly cod: string;
  readonly des: string;
  readonly mto: number | string | null;
  readonly est: string | null;
}

/** Cuerpo de la respuesta del strand. */
export interface ActividadComercialResponseBody {
  readonly resultado?: {
    readonly data?: ActividadComercialFilaDto[];
  };
}

/** Fila ya normalizada para la vista. */
export interface ActividadComercialFila {
  readonly codigo: string;
  readonly descripcion: string;
  readonly monto: number;
  readonly montoFormateado: string;
  readonly estado: string;
  readonly activo: boolean;
}
