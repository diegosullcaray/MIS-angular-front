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
