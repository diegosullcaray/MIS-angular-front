import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import type { TablaReporteResultado } from '../models/tabla-reporte.model';
import type { ReporteResponseBody } from '../models/reportes-api.model';
import type { ColumnaDinamica, TablaDinamicaResultado, TablaRegularResponseBody } from '../models/tabla-dinamica.model';

/**
 * Mapeo compartido de la respuesta cruda del motor de reportes "mixtos"
 * (`regularData`) a la forma que consume `app-tabla-reporte` — mismo mapeo
 * que antes vivía centralizado en `ReportesService.obtenerBloqueReporte()`,
 * ahora reutilizado por el service propio de cada componente para no
 * duplicar el `.pipe(map(...))` en cada uno.
 */
export function mapearBloqueReporte(r: IWinderResponse): TablaReporteResultado {
  const result = (r.body as ReporteResponseBody | null)?.result;
  return { headers: result?.headers ?? [], body: result?.body ?? [], additional: result?.additional ?? {} };
}

/** Mismo mapeo, para el motor `table.regular` (columnas dinámicas) — ver `mapearBloqueReporte()`. */
export function mapearTablaRegular(r: IWinderResponse): TablaDinamicaResultado {
  const resultado = (r.body as TablaRegularResponseBody | null)?.resultado;
  const columnas = resultado?.headers ? (JSON.parse(resultado.headers) as ColumnaDinamica[]) : [];
  return { columnas, filas: (resultado?.data as Record<string, unknown>[]) ?? [] };
}
