/** Fila genérica label/valor — perfil del analista y detalle de cliente comparten esta forma. */
export interface FilaLabelValor {
  lab: string;
  val: string;
}

/**
 * KPIs y datos base del dashboard (`dashboard.resumen` → `resultado.data`).
 * Nombres de campo tal cual el legado
 * (`docs/07-modulos/analista/principal/principal.component.ts`).
 */
export interface DatosResumenAnalista {
  nom: string;
  car: string;
  cod_bt: string;
  /** Fecha de actualización ("Actualizado al"). */
  f4: string;
  sal_cap: number;
  mon_des: number;
  mor_1: number;
  mor_30: number;
  /** Etiquetas de los 3 periodos del comparativo de día (mes actual/anterior/mantenido). */
  f1: string;
  f2: string;
  f3: string;
  sal_cap_ant: number;
  sal_cap_mant: number;
  /** Cartera por tramo de días de atraso: <-30, [-30,0], [1,30], [31,60], 61+, Judicial. */
  da_t1: number;
  da_t2: number;
  da_t3: number;
  da_t4: number;
  da_t5: number;
  da_t6: number;
}

/** Opción del selector de variable del gráfico "Evolutivo Mensual". */
export interface VariableHistorica {
  cod: string;
  des: string;
}

/** Fila de la tabla "Clientes" (tab Créditos). */
export interface FilaClienteCredito {
  num_doc: string;
  nom: string;
  opes: number;
  sal_cap: number;
  /** No se muestran en la tabla, pero viajan en la fila para pedir el detalle del cliente. */
  tip_doc?: number;
  pais?: number;
}

/** Respuesta completa de `dashboard.resumen`. */
export interface ResumenDashboard {
  prof: FilaLabelValor[];
  data: DatosResumenAnalista;
  cli_cre: FilaClienteCredito[];
  h_cods: VariableHistorica[];
}

/** Respuesta de `dashboard.historico` — 3 series para el gráfico "Evolutivo Mensual". */
export interface HistoricoVariable {
  meta: { s1: string; s2: string; s3: string };
  his_1: number[];
  his_2: number[];
  his_3: number[];
}

/** Fila de "Priorización de Leads" (`listas.prio_leads`). */
export interface FilaLead {
  cod_evt: string;
  des_evt: string;
  tip_doc: string;
  num_doc: string;
  des_cli: string;
  ord_ges: number;
  fec_ges: string;
}

/** Fila de "Becas Financiera Confianza" (`listas.pro_becas`). */
export interface FilaBeca {
  /** 1 = ya prospectado. */
  ind_pro: number;
  seg_cli: string;
  des_cli: string;
  num_doc: string;
  des_pro?: string;
  /** Código de sección (analista) que hizo la prospección. */
  ori_sec?: string;
  fec_pro?: string;
  com_pro?: string;
}

/**
 * Nodo crudo de `base_hier` (`ModSysAdminService`) — necesita `flag_1`, igual
 * que en Categorización (`categorizacion/models`, mismo campo, copia
 * independiente por módulo).
 */
export interface NodoJerarquiaAncla {
  tip_cod: number;
  cod_rel: string;
  desc_rel?: string;
  flag_1?: number;
}

/** Ítem de `list_pick_01` — colaborador seleccionable en el buscador. */
export interface ColaboradorItem {
  cod_sec: string;
  des_sec: string;
}
