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

/** Tarjeta de navegación del menú "Listas" (`/app/analista/listas`). */
export interface EnlaceListaAnalista {
  nombre: string;
  descripcion: string;
  icono: string;
  ruta: string;
}
