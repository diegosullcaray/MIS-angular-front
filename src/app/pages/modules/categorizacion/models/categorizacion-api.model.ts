import type { NodoJerarquiaAncla, SectoristaItem } from './colaborador.model';

/** Detalle crudo de `categorizacion.detalle` (backend Ant, módulo `secciones`) — nombres de campo tal cual el legado (`docs/07-modulos/analista/categorizacion`, variable `res`). */
export interface DetalleCategorizacionRaw {
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
