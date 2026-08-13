/**
 * El backend representa las 4 categorías ESG con códigos fijos que NO
 * coinciden con el orden de las pestañas de la pantalla (heredado del
 * legado, ver `PrincipalComponent`): `cod_cat` 1 = Medioambiente,
 * 2 = Social Clientes, 3 = Social Empleados, 4 = Gobierno.
 */

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
