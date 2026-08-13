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
