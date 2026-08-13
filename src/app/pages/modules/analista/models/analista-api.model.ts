/** Formas crudas de `response.body` del backend Ant — solo las usa `AnalistaService` para tipar sus `map()`. */
import type { FilaLabelValor } from './comun.model';
import type { ResumenDashboard, HistoricoVariable } from './dashboard.model';
import type { NodoJerarquiaAncla, ColaboradorItem } from './colaborador.model';

export interface DashboardResponseBody {
  resultado?: ResumenDashboard;
}

export interface HistoricoResponseBody {
  resultado?: HistoricoVariable;
}

export interface ClienteResponseBody {
  resultado?: { prof?: FilaLabelValor[] };
}

export interface ListaResponseBody {
  resultado?: unknown[];
}

export interface PostBecaResponseBody {
  result?: { code?: number; fec_pro?: string };
}

export interface BaseHierResponseBody {
  base_hierarchy?: NodoJerarquiaAncla[];
}

export interface ListPickResponseBody {
  list_res?: ColaboradorItem[];
}
