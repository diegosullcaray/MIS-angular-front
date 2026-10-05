import type { HierarquiaNodo } from './jerarquia.model';
import type { FilaEncabezadoReporte, FilaReporte } from './tabla-reporte.model';

export type { JerarquiaResponseBody } from '../../../../shared/ui/hier-selector/jerarquia.model';

export interface ReporteResponseBody {
  result?: { headers?: FilaEncabezadoReporte[]; body?: FilaReporte[]; additional?: Record<string, unknown> };
}
