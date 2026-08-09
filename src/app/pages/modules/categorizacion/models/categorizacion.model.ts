/**
 * Detalle de categorización de un colaborador (`categorizacion.detalle` del
 * backend Ant, módulo `secciones`) — perfil, estado de 4 requisitos y
 * resultados de comisión de 6 periodos. Nombres de campo tal cual el legado
 * (`docs/07-modulos/analista/categorizacion/categorizacion.component.ts`,
 * variable `res`).
 */
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

/** Perfil resumido del colaborador mostrado en la tarjeta izquierda. */
export interface PerfilColaborador {
  nombre: string;
  cargo: string;
  genero: string;
  categoria: string;
  unidad: string;
  corredor: string;
  territorio: string;
}

/** Tarjeta de "Estado Requisitos" ya lista para pintar. */
export interface RequisitoTarjeta {
  etiqueta: string;
  valor: string;
  cumplido: boolean;
}

/** Tarjeta de "Resultados de Comisión" ya lista para pintar. */
export interface ComisionTarjeta {
  periodo: string;
  valor: string;
  cumplido: boolean;
}

/** Detalle de categorización ya transformado a las 3 piezas que consume la pantalla. */
export interface DetalleCategorizacion {
  perfil: PerfilColaborador;
  requisitos: RequisitoTarjeta[];
  comisiones: ComisionTarjeta[];
}

/**
 * Nodo crudo de `base_hier` (`ModSysAdminService`) — acá se necesita
 * `flag_1`, campo que el selector de jerarquía de Presupuesto no modela
 * porque nunca lo usa (ver `HierarquiaNodo`, `presupuesto/models`). Se
 * preserva el filtro del legado (`flag_1` en `{0,1,2}`) tal cual, sin poder
 * confirmar contra el backend real qué representa cada valor.
 */
export interface NodoJerarquiaAncla {
  tip_cod: number;
  cod_rel: string;
  desc_rel?: string;
  flag_1?: number;
}

/**
 * Ítem de `list_pick_01` (`ModSysAdminService.getListPick01`) — lista de
 * sectoristas bajo un `tip_cod`/`cod_rel` ancla, usada para el selector de
 * colaborador de un admin/supervisor. Nombres de campo sin verificar contra
 * el backend real (ruta no usada por ningún otro módulo ya migrado); se
 * asume el mismo patrón `cod_sec`/`des_sec` que usa el resto del sistema
 * (ver `AntMenuItem.desc_sec` en el sidebar, `ResumenMetadata.cod_sec` en
 * Presupuesto).
 */
export interface SectoristaItem {
  cod_sec: string;
  des_sec: string;
}
