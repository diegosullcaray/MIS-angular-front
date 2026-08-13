import type { FilaTablaEfectividad, FilaTablaVariable } from './incentivos-tablas.model';
import type { AsesorPickItem, NodoJerarquiaIncentivo } from './incentivos-jerarquia.model';
import type { ResultadoDetalleVariable } from './incentivos-detalle.model';
import type { ResultadoBancarizacion } from './incentivos-bancarizacion.model';

/** Respuesta del endpoint de resultados del Cuadro de Mando. */
export interface ResultadosBody {
  resultado?: {
    ds1?: FilaTablaVariable[];
    ds2?: FilaTablaEfectividad[];
    ds3?: Record<string, unknown>;
    ds4?: Record<string, unknown>;
  };
}

/** Respuesta del endpoint de simulación de la Calculadora. */
export interface SimulacionBody {
  resultado?: Record<string, unknown> & { flag_act?: number };
}

/** Respuesta del endpoint de lista de jerarquía. */
export interface ListaJerarquiaBody {
  resultado?: NodoJerarquiaIncentivo[];
}

/** Respuesta del endpoint de picklist de asesores. */
export interface AsesoresBody {
  list_res?: AsesorPickItem[];
}

/** Respuesta del endpoint de detalle de variable. */
export interface DetalleVariableBody {
  resultado?: ResultadoDetalleVariable;
}

/** Respuesta del endpoint de detalle de bancarización. */
export interface BancarizacionBody {
  resultado?: { det?: ResultadoBancarizacion['filas']; tot?: ResultadoBancarizacion['totales'] };
}
