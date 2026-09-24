/**
 * Contratos del módulo Prospecto.
 *
 * Se mantienen separados el payload crudo del backend y el modelo que consume
 * la pantalla: renombrar una columna en Ant no debe obligar a tocar la vista.
 */

/** EJEMPLO pendiente de adaptar: cod/des/mto/est no son campos verificados del reporte. */
export interface ProspectoFilaDto {
  readonly HFECPRO?: string;
  readonly HAPENOMB?: string;
  readonly HNUMDOC?: string;
  readonly HNOMCOM?: string;
  readonly HESTDCORE?: string;
  readonly HFECESTA?: string;
  readonly HCANACAP?: string;
  readonly HDESTER?: string;
  readonly HDESCOR?: string;
  readonly HDESAGE?: string;
}

/** Cuerpo de la respuesta del strand. */
export interface ProspectoResponseBody {
  readonly resultado?: {
    readonly result?: ProspectoFilaDto[]; // NOTA: legacy mapea desde 'result', no desde 'data'
  };
}

/** Fila ya normalizada para la vista. */
export interface ProspectoFila {
  readonly fecha: string;
  readonly nombre: string;
  readonly documento: string;
  readonly comercial: string;
  readonly estado: string;
  readonly fechaEstado: string;
  readonly canal: string;
  readonly territorio: string;
  readonly corredor: string;
  readonly agencia: string;
}
