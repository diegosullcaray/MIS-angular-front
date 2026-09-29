import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';
import type { BloqueGrafico, TipoGraficoMixto } from '../../../../../../shared/ui/graficos/models/grafico-comun.model';
import type { KpiOperacionesDesembolsadas, KpiMontoDesembolsado } from './monitor-metas-desembolso.model';

/** Resultado normalizado de cualquier reporte del panel. */
export interface ResultadoPanelAsesor {
  tabla1?: TablaReporteResultado;
  tabla2?: TablaReporteResultado;
  tabla3?: TablaReporteResultado;
  tabla4?: TablaReporteResultado;
  tabla5?: TablaReporteResultado;
  graficos?: BloqueGrafico[];
  kpiOperaciones?: KpiOperacionesDesembolsadas | null;
  kpiMonto?: KpiMontoDesembolsado | null;
}

export type ClaveTabla = 'tabla1' | 'tabla2' | 'tabla3' | 'tabla4' | 'tabla5';

export type DominioPanel = 'cartera' | 'clientes' | 'colocacion' | 'tasas' | 'seguros' | 'mora';

/** Bloque de un reporte: tabla, título y unidad. */
export interface BloquePanelAsesor {
  tabla: ClaveTabla;
  titulo?: string;
  /** Nota corta mostrada como chip (p. ej. la unidad). */
  chip?: string;
}

export interface ReportePanelAsesor {
  /** `SCODSEC` del menú legacy. */
  codigo: string;
  nombre: string;
  dominio: DominioPanel;
  /** Si se omite, se muestran las tablas que lleguen, en orden. */
  bloques?: readonly BloquePanelAsesor[];
  tipoGrafico?: TipoGraficoMixto;
}

/** Tarjeta del panel y su chip en el detalle. */
export interface DominioPanelDef {
  id: DominioPanel;
  nombre: string;
  /** Texto del chip. */
  pestana: string;
  icono: string;
  alerta?: boolean;
}

export type EstadoConsultaPanel =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; resultado: ResultadoPanelAsesor };

export type TonoPanel = 'bien' | 'revisar' | 'mal' | 'neutro';

/** Cifra de una tabla real, formateada como en la tabla. */
export interface MetricaPanel {
  etiqueta: string;
  valor: string;
  detalle?: string;
  tono: TonoPanel;
}

/** Barra de una tarjeta; `porcentaje` y `marca` van de 0 a 100. */
export interface BarraPanel {
  etiqueta: string;
  valor: string;
  porcentaje: number;
  tono: TonoPanel | 'referencia';
  marca?: number | null;
}

/** Resumen de una tarjeta y KPI de su detalle, desde las tablas reales. */
export interface ResumenDominio {
  destacado?: { valor: string; texto: string } | null;
  tituloBarras?: string;
  barras: BarraPanel[];
  notaBarras?: string;
  lista: MetricaPanel[];
  pie: MetricaPanel[];
  /** KPI del detalle. */
  indicadores: MetricaPanel[];
}
