import type { HierarquiaNodo } from './jerarquia.model';
import type { FilaEncabezadoReporte, FilaReporte } from './tabla-reporte.model';

export interface JerarquiaResponseBody {
  base_hierarchy?: HierarquiaNodo[];
  level_hierarchy?: HierarquiaNodo[];
}

export interface ReporteResponseBody {
  result?: { headers?: FilaEncabezadoReporte[]; body?: FilaReporte[]; additional?: Record<string, unknown> };
}
