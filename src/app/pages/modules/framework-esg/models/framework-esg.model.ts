/**
 * Modelos del módulo "Framework ESG" (`/app/esg`) — migrado del legado STG
 * (`pages/modules/framework-esg`, backend Ant módulo `esg`, mismo
 * port/appId/secret que Presupuesto/Kaypacha — ver `ModFrameworkEsgService`).
 *
 * El backend representa las 4 categorías ESG con códigos fijos que NO
 * coinciden con el orden de las pestañas de la pantalla (heredado del
 * legado, ver `PrincipalComponent`): `cod_cat` 1 = Medioambiente,
 * 2 = Social Clientes, 3 = Social Empleados, 4 = Gobierno.
 */

/** Opción de "Situación" de una métrica (`sit_met`) — poblada desde `esg.cfg_mod`. */
export interface EsgSituacionOpcion {
  cod: number | string;
  des: string;
}

/** Atributo configurable por métrica (clave dentro de `cfg_met`, serializado en JSON). */
export interface EsgAtributoConfig {
  key: string;
  label: string;
}

/** Categoría ESG configurada en el backend (`cats.cfg` de `esg.cfg_mod`). */
export interface EsgCategoriaConfig {
  cod: number;
  des: string;
}

/** Configuración global del módulo — `esg.cfg_mod`. */
export interface EsgConfiguracionModulo {
  situaciones: EsgSituacionOpcion[];
  atributos: EsgAtributoConfig[];
  categorias: EsgCategoriaConfig[];
  /** `mod_admin.cfg` — admin del módulo (se combina con `ShellStateService.esAdmin()`, ver `esAdmin()` del facade). */
  moduloAdmin: boolean;
  /** `can_edit.cfg` — habilita edición independientemente del rol. */
  puedeEditar: boolean;
}

/** Fila de la tabla resumen de "Portada" — `esg.res_por`. */
export interface EsgResumenPortadaFila {
  des: string;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c99: number;
  is_nod?: number;
  [key: string]: unknown;
}

/** Fila de métrica de una categoría — `esg.res_cat` (`resultado.res`). */
export interface EsgMetricaFila {
  cod_met: number;
  cod_cat: number;
  des_met: string;
  des_med: string;
  des_dis: string;
  sit_met: number | string;
  /** 1 = la fila es editable (habilita el botón "Editar"). */
  is_edit?: number;
  /** 1 = fila de agrupación/nodo (deshabilita el botón "Detalles"). */
  is_nod?: number;
  /** JSON serializado con los valores de `EsgAtributoConfig[]`. */
  cfg_met: string;
  /** Columnas históricas dinámicas (una por cada clave de `EsgResumenCategoria.columnasHistoricas`). */
  [key: string]: unknown;
}

/** Respuesta parseada de `esg.res_cat` para una categoría puntual. */
export interface EsgResumenCategoria {
  /** Claves de columnas históricas dinámicas (`resultado.cab.cols`, separadas por coma). */
  columnasHistoricas: string[];
  filas: EsgMetricaFila[];
}

/** Ítem de la lista de métricas de una categoría — usado por el diálogo de Usuarios. */
export interface EsgMetricaListItem {
  id: string;
  nombre: string;
}

/** Payload de `esg.act_met` — actualización de una métrica. */
export interface EsgActualizarMetricaPayload {
  des_dis: string;
  sit_met: number | string;
  hist: Record<string, unknown>;
  cfg_met: Record<string, unknown>;
}

/** Ítem de `esg.post_users` — usuarios con acceso a una métrica puntual. */
export interface EsgUsuariosPorMetrica {
  id: string;
  val: string;
}
