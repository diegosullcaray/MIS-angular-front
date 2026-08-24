import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import type { TablaDinamicaResultado, TablaRegularResultadoRaw } from '../../../../../models/tabla-dinamica.model';
import type { ColumnaMonitor } from '../models/monitor-inteligencia.model';
import { COLUMNAS_RANKING_COMERCIAL } from '../models/ranking-comercial.columnas';

/** Los reportes de Cartera que viven en el `repositorio` del legado (motor `table.regular`). */
@Injectable({ providedIn: 'root' })
export class CarteraRepositorioService {
  private readonly bloques = inject(BloqueReporteService);
  private readonly reportes = inject(ModReportesService);

  /**
   * "Estructura de Desembolsos" — legado `repositorio/desembolsos` (`RS_DESEMB_01`).
   *
   * El legado además corre un `processHeaders()` que asigna un `cellRenderer`
   * a algunas subcolumnas, pero esa función devuelve el valor sin tocarlo en
   * las dos ramas: es código muerto y no se porta.
   */
  estructuraDesembolsos(nodo: NodoConsulta): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegularCon('RS_DESEMB_01', {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      fec: this.bloques.fecha(),
    });
  }

  /**
   * "Ranking Comercial" — legado `repositorio/ranking-comercial` (`RS_RANK_COM_01`).
   *
   * Ojo con los parámetros: este reporte manda el nodo como
   * `territorio`/`corredor`, no como `tip_cod`/`cod_rel`.
   *
   * Las tres columnas `*_Semaforo` no vienen del backend: las arma el cliente
   * comparando cada avance contra el `Timing` (días transcurridos) de la fila,
   * por eso las cabeceras son fijas y no las del payload.
   */
  rankingComercial(nodo: NodoConsulta): Observable<TablaDinamicaResultado> {
    const params = { territorio: nodo.cod_rel, corredor: nodo.tip_cod, fecha: this.bloques.fecha() };
    return this.bloques
      .tablaRegularCon('RS_RANK_COM_01', params)
      .pipe(map(({ filas }) => ({ columnas: COLUMNAS_RANKING_COMERCIAL, filas: filas.map(conSemaforos) })));
  }

  /**
   * "Monitor de Inteligencia de Negocios" — legado `repositorio/mon-int-comer`
   * (`RS_MON_INT_COM_01`).
   *
   * No devuelve una tabla, así que no pasa por `tablaRegularCon`: el tablero
   * de columnas y tarjetas viene dentro de `resultado.headers`, que el legado
   * desenvuelve un nivel cuando llega anidado.
   */
  monitorInteligencia(nodo: NodoConsulta): Observable<ColumnaMonitor[]> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fecha: this.bloques.fecha() };
    return this.reportes.getRegularTableResult('RS_MON_INT_COM_01', params).pipe(
      map((r) => {
        const crudo = (r.body as { resultado?: TablaRegularResultadoRaw } | null)?.resultado?.headers;
        if (!crudo) return [];
        const parseado = JSON.parse(crudo) as ColumnaMonitor[] | ColumnaMonitor[][];
        return Array.isArray(parseado[0]) ? (parseado[0] as ColumnaMonitor[]) : (parseado as ColumnaMonitor[]);
      }),
    );
  }
}

/** Avance con su semáforo delante, en el formato exacto del legado (`🟢 15.28%`). */
function semaforo(avanceCrudo: unknown, timingDecimal: number): string {
  const avance = Number(avanceCrudo);
  if (avanceCrudo == null || Number.isNaN(avance)) return '';

  const formateado = `${(avance * 100).toFixed(2)}%`;
  if (timingDecimal === 0) return formateado;

  const icono = avance >= timingDecimal ? '🟢' : avance / timingDecimal >= 0.8 ? '🟡' : '🔴';
  return `${icono} ${formateado}`;
}

/** Claves de avance del legado y la columna calculada que alimenta cada una. */
const AVANCES: [origen: string, destino: string][] = [
  ['Percent_Cumpl', 'Percent_Cumpl_Semaforo'],
  ['percent_cumpl_desemb', 'percent_cumpl_desemb_Semaforo'],
  ['percent_cumpl_varsalv', 'percent_cumpl_varsalv_Semaforo'],
];

function conSemaforos(fila: Record<string, unknown>): Record<string, unknown> {
  const timing = fila['Timing'] ? Number(fila['Timing']) / 100 : 0;
  const calculadas = Object.fromEntries(AVANCES.map(([origen, destino]) => [destino, semaforo(fila[origen], timing)]));
  return { ...fila, ...calculadas };
}
