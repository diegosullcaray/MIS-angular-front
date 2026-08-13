/** Item de la lista de colaboradores para selección en buscador. */
export interface KaypachaColaboradorItem {
  cod_bt: string;
  num_doc?: string;
  des_col: string;
  HCOLCAR: string;
  RCODCOL: string;
  pk?: number;
}

/** Datos del perfil de usuario/colaborador. */
export interface KaypachaDatosUsuario {
  HDESPER?: string;
  HDESCAR?: string;
}
