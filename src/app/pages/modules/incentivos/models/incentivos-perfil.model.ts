/** Nodo o usuario consultado en el Cuadro de Mando. */
export interface NivelSeleccionado {
  tipCod: number;
  codRel: string;
  /** 0 = sin asignar, 1 = individual, 2 = grupal. */
  claUsu: number;
}

/** Encabezado del perfil consultado (nombre, nivel, foto). */
export interface PerfilUsuarioIncentivo {
  nombre: string;
  nivel: string;
  descripcionNivel: string;
  imagenUrl: string;
}

/** Configuración de variables aplicables según cargo y tipo de usuario. */
export interface ConfiguracionUsuarioIncentivos {
  prof: string[];
  avanS: string[];
  avanE: string[];
  avanFlex: number;
  supS: string[];
  supE: string[];
  calE: string[];
  calS: string[];
}
