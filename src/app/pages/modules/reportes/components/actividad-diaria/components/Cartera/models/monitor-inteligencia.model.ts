/**
 * "Monitor de Inteligencia de Negocios" no devuelve una tabla: su
 * `resultado.headers` describe un tablero de columnas de tarjetas
 * (`mon-int-comer.component.html` del legado).
 */

export interface TendenciaTarjeta {
  valor: string;
  esPositivo: boolean;
  subLabel?: string;
}

export interface MetaTarjeta {
  label: string;
  /** Ya viene con `%`; el legado lo usa tal cual como ancho de la barra. */
  porcentaje: string;
}

/** Cada mitad de una tarjeta `tapp`. */
export interface ItemTarjetaTapp {
  label: string;
  valor: string;
  tendencia: string;
  esPositivo: boolean;
}

export interface TarjetaMonitor {
  tipo: 'estandar' | 'tapp';
  label: string;
  valor?: string;
  tendencias?: TendenciaTarjeta[];
  meta?: MetaTarjeta;
  items?: ItemTarjetaTapp[];
}

export interface ColumnaMonitor {
  titulo: string;
  /** Clase de color del legado (`met`, etc.). */
  estilo?: string;
  /** `1` marca la columna principal. */
  style?: number;
  tarjetas: TarjetaMonitor[];
}
