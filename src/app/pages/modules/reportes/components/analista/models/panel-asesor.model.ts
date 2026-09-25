import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';
import type { BloqueGrafico, TipoGraficoMixto } from '../../../../../../shared/ui/graficos/models/grafico-comun.model';
import type { KpiOperacionesDesembolsadas, KpiMontoDesembolsado } from './monitor-metas-desembolso.model';

/** Resultado normalizado de cualquiera de los 17 reportes del panel: cada servicio original ya lo cumple. */
export interface ResultadoPanelAsesor {
  tabla1?: TablaReporteResultado;
  tabla2?: TablaReporteResultado;
  tabla3?: TablaReporteResultado;
  tabla4?: TablaReporteResultado;
  graficos?: BloqueGrafico[];
  kpiOperaciones?: KpiOperacionesDesembolsadas | null;
  kpiMonto?: KpiMontoDesembolsado | null;
}

export type ClaveTabla = 'tabla1' | 'tabla2' | 'tabla3' | 'tabla4';

/** Categorías de navegación del panel, pensadas para el día a día del asesor. */
export type GrupoPanelAsesor = 'cartera' | 'colocacion' | 'recuperacion' | 'gestion';

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
  grupo: GrupoPanelAsesor;
  icono: string;
  /** Orden y títulos de los bloques; si se omite, se muestran las tablas que lleguen en orden. */
  bloques?: readonly BloquePanelAsesor[];
  /** Forma de los gráficos que el reporte ya trae del motor. */
  tipoGrafico?: TipoGraficoMixto;
}

export interface GrupoPanelAsesorDef {
  id: GrupoPanelAsesor;
  nombre: string;
  icono: string;
}

/** `resumen` es la vista 360; el resto es el `codigo` del reporte abierto. */
export type VistaPanelAsesor = 'resumen' | string;

export type EstadoConsultaPanel =
  | { estado: 'cargando' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'listo'; resultado: ResultadoPanelAsesor };

/** Indicador derivado de una fila de totales, ya formateado para la vista. */
export interface KpiPanelAsesor {
  etiqueta: string;
  valor: string;
  /** Semáforo del motor (`style_<col>`): 1 verde, 0 ámbar, -1 rojo. */
  semaforo: 1 | 0 | -1 | null;
}
