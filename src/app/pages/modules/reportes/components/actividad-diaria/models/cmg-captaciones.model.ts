import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

/**
 * Resultado de "CMG Captaciones - Agencias" (`CmgCaptacionesService.obtenerCmgCaptaciones`).
 *
 * Un solo bloque en el legado (`cra-map.ts`: `module: 'GCMGCAP'`, `table: [{ id: '_01' }]`),
 * de ahí que solo exista `tabla1`.
 */
export interface ReporteCmgCaptaciones {
  tabla1: TablaReporteResultado;
}
