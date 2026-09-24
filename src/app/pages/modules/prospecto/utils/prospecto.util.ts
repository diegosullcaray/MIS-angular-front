import type { ProspectoFila, ProspectoFilaDto } from '../models/prospecto.model';

/**
 * Mapeos puros del módulo Prospecto: sin HttpClient, sin inject(), sin señales.
 * Todo lo que decida qué ve el usuario a partir del payload vive acá, porque es
 * lo único que se puede probar sin levantar Angular.
 */

export function mapProspectoFila(dto: ProspectoFilaDto): ProspectoFila {
  const estado = (dto?.HESTDCORE ?? '').trim();

  return {
    fecha: dto?.HFECPRO ?? '',
    nombre: dto?.HAPENOMB ?? '',
    documento: dto?.HNUMDOC ?? '',
    comercial: dto?.HNOMCOM ?? '',
    estado,
    fechaEstado: dto?.HFECESTA ?? '',
    canal: dto?.HCANACAP ?? '',
    territorio: dto?.HDESTER ?? '',
    corredor: dto?.HDESCOR ?? '',
    agencia: dto?.HDESAGE ?? '',
  };
}

/** Una respuesta sin filas es una respuesta válida vacía, no un error. */
export function mapProspectoFilas(dtos: readonly ProspectoFilaDto[] | null | undefined): ProspectoFila[] {
  if (dtos == null) return [];
  if (!Array.isArray(dtos)) throw new Error('Payload de filas inválido.');
  return dtos.map(mapProspectoFila);
}

