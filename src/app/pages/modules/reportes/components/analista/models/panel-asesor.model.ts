import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';
import type { BloqueGrafico, TipoGraficoMixto } from '../../../../../../shared/ui/graficos/models/grafico-comun.model';
import type { KpiOperacionesDesembolsadas, KpiMontoDesembolsado } from './monitor-metas-desembolso.model';

/** Resultado normalizado de cualquiera de los reportes del panel: cada servicio original ya lo cumple. */
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

/** Dominios del tablero del asesor: una tarjeta y una pestaña del detalle por cada uno. */
export type DominioPanel = 'cartera' | 'clientes' | 'colocacion' | 'tasas' | 'seguros' | 'mora';

/** Un bloque tal como lo presenta la pantalla legacy: qué tabla, con qué título y qué nota al pie. */
export interface BloquePanelAsesor {
  tabla: ClaveTabla;
  titulo?: string;
  /** Nota corta sobre la tabla (p. ej. la unidad), mostrada como chip; no es un título. */
  chip?: string;
  nota?: readonly string[];
}

export interface ReportePanelAsesor {
  /** `SCODSEC` del menú legacy. */
  codigo: string;
  nombre: string;
  ruta: string;
  /** Tráfico histórico: solo ordena la navegación, no se muestra. */
  peticiones: number;
  descripcion: string;
  /** Tarjeta del tablero en cuyo detalle aparece. */
  dominio: DominioPanel;
  icono: string;
  /** Orden y títulos de los bloques; si se omite, se muestran las tablas que lleguen en orden. */
  bloques?: readonly BloquePanelAsesor[];
  /** Forma de los gráficos que el reporte ya trae del motor. */
  tipoGrafico?: TipoGraficoMixto;
}

/** Una tarjeta del tablero y su pestaña en el diálogo de detalle. */
export interface DominioPanelDef {
  id: DominioPanel;
  /** Título de la tarjeta y del detalle. */
  nombre: string;
  /** Rótulo corto de la pestaña del detalle. */
  pestana: string;
  /** Bajada del encabezado del detalle. */
  subtitulo: string;
  icono: string;
  /** La tarjeta de recuperación va en tono de alerta, como en la maqueta. */
  alerta?: boolean;
}

export type EstadoConsultaPanel =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; resultado: ResultadoPanelAsesor };

/** Tono de una cifra: favorable, a revisar o en alerta; neutro si no hay juicio. */
export type TonoPanel = 'bien' | 'revisar' | 'mal' | 'neutro';

/** Cifra resumida de una tabla real, ya formateada como la muestra la tabla. */
export interface MetricaPanel {
  etiqueta: string;
  valor: string;
  /** Comparación (variación, contexto) debajo o al lado de la cifra. */
  detalle?: string;
  tono: TonoPanel;
}

/** Barra horizontal de una tarjeta; `porcentaje` es el largo (0–100). */
export interface BarraPanel {
  etiqueta: string;
  valor: string;
  porcentaje: number;
  tono: TonoPanel | 'referencia';
  /** Marca vertical (p. ej. días hábiles transcurridos), 0–100. */
  marca?: number | null;
}

/** Resumen de una tarjeta y de la cabecera de su detalle. Todo sale de las tablas reales. */
export interface ResumenDominio {
  /** Cifra grande con su explicación (autonomía de tasas, seguros). */
  destacado?: { valor: string; texto: string } | null;
  /** Rótulo sobre las barras. */
  tituloBarras?: string;
  barras: BarraPanel[];
  /** Nota bajo las barras (p. ej. qué marca la línea vertical). */
  notaBarras?: string;
  /** Filas "etiqueta · valor · variación" (seguros). */
  lista: MetricaPanel[];
  /** Tres cifras del pie de la tarjeta. */
  pie: MetricaPanel[];
  /** Cuatro indicadores de la cabecera del detalle. */
  indicadores: MetricaPanel[];
}

/** Aviso de "Focos de atención": solo aparece si los datos reales cumplen su regla. */
export interface FocoPanel {
  dominio: DominioPanel;
  titulo: string;
  texto: string;
  tono: Exclude<TonoPanel, 'bien' | 'neutro'>;
}
