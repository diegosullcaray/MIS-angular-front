import type { HierarquiaNodo } from './jerarquia.model';
import type { ResumenLineaSimple } from './linea-simple.model';
import type { ResumenCarteraCreditos } from './cartera-creditos.model';

/** Forma de `response.body` para las rutas `presupuesto.get_car_cre`/`get_dep_bp`/ `get_dep_red`/`get_seg_com`/`get_seg_ope` — `responseName='resumen'`, forma compuesta (objeto con `ws`/`bp`/`cs`), como `login_response`/`menu_response`: se asume que llega anidada directo, sin envoltura `JSONLIST`. */
export interface ResumenResponseBody {
  resumen?: ResumenLineaSimple | ResumenCarteraCreditos;
}

/** Forma de `response.body` para `base_hier`/`level_hier` (`ModSysAdminService`). */
export interface JerarquiaResponseBody {
  base_hierarchy?: HierarquiaNodo[];
  level_hierarchy?: HierarquiaNodo[];
}
