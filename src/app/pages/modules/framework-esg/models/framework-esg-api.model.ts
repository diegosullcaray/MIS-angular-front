import type { EsgMetricaFila, EsgResumenPortadaFila } from './metrica.model';

/** Forma cruda de `esg.cfg_mod` (`resultado`) — cada bloque trae su valor de negocio serializado en `cfg` (JSON string). */
export interface ConfiguracionModuloBody {
  resultado?: {
    sit?: { cfg?: string };
    attr?: { cfg?: string };
    cats?: { cfg?: string };
    mod_admin?: { cfg?: string };
    can_edit?: { cfg?: string };
  };
}

/** Forma cruda de `esg.res_por` (`resultado`) — arreglo directo, sin envoltura `JSONLIST`. */
export interface ResumenPortadaBody {
  resultado?: EsgResumenPortadaFila[];
}

/** Forma cruda de `esg.res_cat` (`resultado`) — columnas históricas dinámicas + filas. */
export interface ResumenCategoriaBody {
  resultado?: {
    cab?: { cols?: string };
    res?: EsgMetricaFila[];
  };
}

/** Forma cruda de `esg.get_users` (`resultado`) — `row.use_lis` es una lista de `cod_bt` separada por coma, ausente si no hay usuarios. */
export interface UsuariosMetricaBody {
  resultado?: {
    code?: string;
    row?: { use_lis?: string };
  };
}
