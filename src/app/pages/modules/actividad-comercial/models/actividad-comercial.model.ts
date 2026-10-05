/** Modelos de vista del Tablero de Mando del asesor (Actividad Comercial). Datos de ejemplo por ahora: sin DTO de backend. */

export type TonoDelta = 'positivo' | 'negativo' | 'neutro';
export type FormatoKpi = 'entero' | 'porcentaje' | 'operaciones' | 'asesores';

/** Indicador de pie de tarjeta: valor, variación opcional y una línea de apoyo. */
export interface KpiTablero {
  etiqueta: string;
  valor: number;
  formato: FormatoKpi;
  /** Texto ya formateado de la variación (p. ej. `+4`, `−0.7 pp`). */
  delta?: string;
  tono?: TonoDelta;
  /** Línea neutra bajo el valor (p. ej. `Top 10`). */
  apoyo?: string;
  /** Resalta el valor como alerta. */
  alerta?: boolean;
}

/** Valor frente a una meta; `avanceEsperado` (0–100) marca dónde debería ir el mes. */
export interface ProgresoMeta {
  etiqueta: string;
  valor: number;
  meta: number;
  formato: FormatoKpi;
  /** Texto del avance cuando difiere del número (p. ej. `8 ops`). */
  etiquetaValor?: string;
  avanceEsperado?: number;
}

export interface EjeDesempeno {
  etiqueta: string;
  asesor: number;
  promedio: number;
}

export interface DesempenoAsesor {
  iniciales: string;
  nombre: string;
  cargo: string;
  score: number;
  calificacion: string;
  ejes: readonly EjeDesempeno[];
}

export interface DesembolsosAsesor {
  operaciones: ProgresoMeta;
  monto: ProgresoMeta;
  avanceEsperado: number;
  etiquetaAvanceEsperado: string;
  kpis: readonly KpiTablero[];
}

export interface RecuperadoAsesor {
  titulo: string;
  recuperado: number;
  total: number;
  formato: FormatoKpi;
}

export interface MoraAsesor {
  recuperaciones: readonly RecuperadoAsesor[];
  efectividades: readonly ProgresoMeta[];
  kpis: readonly KpiTablero[];
}

export interface TipoSeguro {
  nombre: string;
  polizas: number;
  /** Token CSS del color de la categoría. */
  color: string;
}

export interface SegurosAsesor {
  ingresos: ProgresoMeta;
  polizas: ProgresoMeta;
  tipos: readonly TipoSeguro[];
  kpis: readonly KpiTablero[];
}

/** Un tramo de la columna apilada (de abajo hacia arriba); la heredada se muestra aparte y no suma al total. */
export interface SegmentoColumna {
  clave: 'trasladada' | 'propia' | 'heredada';
  etiqueta: string;
  valor: number;
}

export interface ColumnasCartera {
  titulo: string;
  formato: FormatoKpi;
  hoy: readonly SegmentoColumna[];
  totalHoy: number;
  cierreAnterior: number;
  meta?: number;
  /** Paleta del gráfico. */
  paleta: 'saldo' | 'operaciones';
}

export interface CarteraAsesor {
  saldo: ColumnasCartera;
  operaciones: ColumnasCartera;
  kpis: readonly KpiTablero[];
}

export interface MovimientoCliente {
  etiqueta: string;
  valor: number;
}

export interface ClientesAsesor {
  hoy: number;
  cierreAnterior: number;
  movimientos: readonly MovimientoCliente[];
  crecimientoNeto: number;
  metaVariacion: number;
  kpis: readonly KpiTablero[];
}

export interface TableroAsesor {
  asesor: string;
  periodo: string;
  corte: string;
  desempeno: DesempenoAsesor;
  desembolsos: DesembolsosAsesor;
  mora: MoraAsesor;
  seguros: SegurosAsesor;
  cartera: CarteraAsesor;
  clientes: ClientesAsesor;
}

/** Tarjetas del tablero, en el orden en que se pintan. */
export type DominioTablero = 'desempeno' | 'desembolsos' | 'mora' | 'seguros' | 'cartera' | 'clientes';
