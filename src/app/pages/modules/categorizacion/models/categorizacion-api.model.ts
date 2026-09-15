import type { NodoJerarquiaAncla, SectoristaItem } from './colaborador.model';

/** Detalle crudo de `categorizacion.detalle` (backend Ant, módulo `secciones`) — nombres de campo tal cual el legado (`docs/07-modulos/analista/categorizacion`, variable `res`). */
export interface DetalleCategorizacionRaw {
  /** 1: comisión individual con detalle por indicador; 2: comisión grupal resumida. */
  codgru: number;
  nom: string;
  car: string;
  gen: string;
  cat: string;
  uni: string;
  corr: string;
  terr: string;
  r1: string;
  ri1: number;
  r2: string;
  ri2: number;
  r3: string;
  ri3: number;
  r4: string;
  ri4: number;
  c1: string;
  ci1: number;
  c2: string;
  ci2: number;
  c3: string;
  ci3: number;
  c4: string;
  ci4: number;
  c5: string;
  ci5: number;
  c6: string;
  ci6: number;
  c1_1: number; c1_2: number; c1_3: number; c1_4: number; c1_5: number; c1_6: number;
  c2_1: number; c2_2: number; c2_3: number; c2_4: number; c2_5: number; c2_6: number;
  c3_1: number; c3_2: number; c3_3: number; c3_4: number; c3_5: number; c3_6: number;
  c4_1: number; c4_2: number; c4_3: number; c4_4: number; c4_5: number; c4_6: number;
  c5_1: number; c5_2: number; c5_3: number; c5_4: number; c5_5: number; c5_6: number;
  c6_1: number; c6_2: number; c6_3: number; c6_4: number; c6_5: number; c6_6: number;
}

/** `per` del legado — nombre de cada uno de los 6 periodos de comisión. */
export interface PeriodoComisionRaw {
  nom: string;
}

/** Formas crudas de `response.body` del backend Ant — solo las usa `CategorizacionService` para tipar sus `map()`. */
export interface DetalleResponseBody {
  resultado?: { data?: DetalleCategorizacionRaw; per?: PeriodoComisionRaw[] };
}

export interface BaseHierResponseBody {
  base_hierarchy?: NodoJerarquiaAncla[];
}

export interface ListPickResponseBody {
  list_res?: SectoristaItem[];
}
