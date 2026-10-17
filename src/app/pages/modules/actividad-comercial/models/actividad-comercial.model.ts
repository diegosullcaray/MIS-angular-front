/** Modelos de vista del Tablero de Seguimiento (Actividad Comercial). Salen de una fila del SP `RTABSEG01` (reporte `TAB_SEG_01`). */

export type TonoDelta = 'positivo' | 'negativo' | 'neutro';
export type FormatoKpi = 'entero' | 'decimal' | 'porcentaje' | 'operaciones' | 'asesores';

/** Indicador de pie de tarjeta: valor, variación opcional y una línea de apoyo. `valor` nulo = sin dato (se muestra `—`, nunca 0). */
export interface KpiTablero {
  etiqueta: string;
  valor: number | null;
  formato: FormatoKpi;
  /** Texto ya formateado de la variación (p. ej. `+4`, `−0.7 pp`). */
  delta?: string;
  tono?: TonoDelta;
  /** Línea neutra bajo el valor (p. ej. `48,320`). */
  apoyo?: string;
  /** Resalta el valor como alerta. */
  alerta?: boolean;
}

/** Valor frente a una meta; `avanceEsperado` (0–100) marca dónde debería ir el mes. Sin meta, la tarjeta muestra solo el valor. */
export interface ProgresoMeta {
  etiqueta: string;
  valor: number;
  meta: number | null;
  formato: FormatoKpi;
  /** Texto del avance cuando difiere del número (p. ej. `8 ops`). */
  etiquetaValor?: string;
}

export interface DesembolsosAsesor {
  operaciones: ProgresoMeta;
  /** Monto desembolsado (PEN). La meta de monto está diferida: no hay barra. */
  monto: number;
  avanceEsperado: number;
  etiquetaAvanceEsperado: string;
  kpis: readonly KpiTablero[];
}

export interface RecuperadoAsesor {
  titulo: string;
  recuperado: number;
  total: number;
  /** Porcentaje recuperado (0–100) según la regla del SP; nulo cuando no hay programación con cartera de inicio. */
  porcentaje: number | null;
}

/** Efectividad por tramo (0–100) y su meta; nulos = sin dato o sin meta. */
export interface EfectividadAsesor {
  etiqueta: string;
  valor: number | null;
  meta: number | null;
}

export interface MoraAsesor {
  recuperaciones: readonly RecuperadoAsesor[];
  efectividades: readonly EfectividadAsesor[];
  kpis: readonly KpiTablero[];
}

export interface TipoSeguro {
  nombre: string;
  polizas: number;
  /** Token CSS del color de la categoría. */
  color: string;
}

export interface SegurosAsesor {
  polizas: ProgresoMeta;
  tipos: readonly TipoSeguro[];
  kpis: readonly KpiTablero[];
}

/** Un tramo de la columna apilada (de abajo hacia arriba); la trasladada se muestra aparte y no suma al total. */
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
  /** Nulo cuando el cierre anterior no está cargado. */
  cierreAnterior: number | null;
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
  cierreAnterior: number | null;
  movimientos: readonly MovimientoCliente[];
  /** Nulo sin cierre anterior. */
  crecimientoNeto: number | null;
  /** Nulo si la entidad no tiene meta de variación. */
  metaVariacion: number | null;
  kpis: readonly KpiTablero[];
}

/** Semáforo de cumplimiento de la meta de usabilidad: 1 verde, 0 ámbar, −1 rojo. */
export type SemaforoDigital = 1 | 0 | -1;

/** Un anillo del panel Digital: `fraccion` (0–1) es el valor; la meta y el semáforo existen solo en las usabilidades. */
export interface AnilloDigital {
  titulo: string;
  fraccion: number;
  numerador: number;
  denominador: number;
  /** Variación en puntos porcentuales frente al cierre anterior; nulo sin cierre anterior. */
  variacionPp: number | null;
  meta?: number;
  cumplimiento?: number;
  semaforo?: SemaforoDigital;
  descripcion: string;
}

export interface DigitalAsesor {
  anillos: readonly AnilloDigital[];
  kpis: readonly KpiTablero[];
}

export interface TableroAsesor {
  /** Entidad elegida en la jerarquía (descripción del nodo). */
  entidad: string;
  periodo: string;
  corte: string;
  desembolsos: DesembolsosAsesor;
  mora: MoraAsesor;
  /** Nulo mientras la carga de seguros no corrió (pendiente, no cero). */
  seguros: SegurosAsesor | null;
  cartera: CarteraAsesor;
  clientes: ClientesAsesor;
  digital: DigitalAsesor;
}
