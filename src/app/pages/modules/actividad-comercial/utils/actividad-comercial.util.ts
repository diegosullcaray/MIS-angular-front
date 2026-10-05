import type { ActividadComercialFila, ActividadComercialFilaDto } from '../models/actividad-comercial.model';

/**
 * Mapeos puros del módulo Actividad Comercial: sin HttpClient, sin inject(), sin señales.
 * Todo lo que decida qué ve el usuario a partir del payload vive acá, porque es
 * lo único que se puede probar sin levantar Angular.
 */

/** El backend manda montos como número o como cadena; y a veces como null. */
function aNumero(valor: number | string | null | undefined): number {
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
  if (typeof valor !== 'string') return 0;
  let texto = valor.trim().replace(/^S\/\s*/, '').replace(/\s/g, '');
  if (!/^-?\d[\d.,]*$/.test(texto)) throw new Error('Monto inválido.');
  // Ejemplos soportados: 2 300,00, 1.250,75 y S/ 1,250.75.
  // Una única coma con tres dígitos finales se interpreta como miles.
  // Revisar esta ambigüedad contra el contrato; no quitar puntuación a ciegas.
  const coma = texto.lastIndexOf(',');
  const punto = texto.lastIndexOf('.');
  if (coma > punto && (punto >= 0 || !/^-?\d{1,3}(,\d{3})+$/.test(texto))) {
    texto = texto.replace(/\./g, '').replace(',', '.');
  } else {
    texto = texto.replace(/,/g, '');
  }
  const numero = Number(texto);
  if (!Number.isFinite(numero)) throw new Error('Monto inválido.');
  return numero;
}

const SOLES = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' });

export function mapActividadComercialFila(dto: ActividadComercialFilaDto): ActividadComercialFila {
  const monto = aNumero(dto?.mto);
  const estado = (dto?.est ?? '').trim();

  return {
    codigo: dto?.cod ?? '',
    descripcion: dto?.des ?? '',
    monto,
    montoFormateado: SOLES.format(monto),
    estado,
    activo: estado.toUpperCase() === 'ACTIVO',
  };
}

/** Una respuesta sin filas es una respuesta válida vacía, no un error. */
export function mapActividadComercialFilas(dtos: readonly ActividadComercialFilaDto[] | null | undefined): ActividadComercialFila[] {
  if (dtos == null) return [];
  if (!Array.isArray(dtos)) throw new Error('Payload de filas inválido.');
  return dtos.map(mapActividadComercialFila);
}

export function totalActividadComercial(filas: readonly ActividadComercialFila[]): number {
  return filas.reduce((suma, fila) => suma + fila.monto, 0);
}
