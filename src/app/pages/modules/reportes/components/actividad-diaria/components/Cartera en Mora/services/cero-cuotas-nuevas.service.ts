import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import { filasDeResultado, mapearBloquesGrafico, resultadoCrudo } from '../../../../../utils/reportes-mapeo.util';
import {
  COD_BASE_GESTION,
  COD_CERO_CUOTAS,
  COD_DASHBOARD_REVISION,
  CORTES_TOP_CERO_CUOTAS,
  GRAFICOS_DASHBOARD_REVISION,
} from '../constantes/cartera-mora.constantes';
import { graficoDashboardRevision } from '../utils/cero-cuotas-mapeo.util';
import type { ReporteBloqueUnico, TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { BloqueGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';

/**
 * Los reportes del nodo "Cero Cuotas Nuevas".
 *
 * Comparten jerarquía `UNI_1` y el corte como `fec`, pero no el strand: el
 * Dashboard va por `graphicData` y "Base de Gestión" por el host paginado.
 */
@Injectable({ providedIn: 'root' })
export class CeroCuotasNuevasService {
  private readonly bloques = inject(BloqueReporteService);
  private readonly reportes = inject(ModReportesService);

  /** Dashboard. Devuelve gráficos, no una tabla; el `fec` va como filtro. */
  dashboard(nodo: NodoConsulta): Observable<BloqueGrafico[]> {
    return this.reportes
      .getGraphicData(COD_CERO_CUOTAS.dashboard, { ...this.paramsNodo(nodo), fec: this.bloques.fec() })
      .pipe(map(mapearBloquesGrafico));
  }

  /** Cuadro de Mando. Sus dos bloques comparten los filtros `prod` y `tipcuota`. */
  cuadroMando(nodo: NodoConsulta, filtros: Record<string, unknown>): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      COD_CERO_CUOTAS.cuadroMando.map((codRep) => ({ codRep, extra: filtros })),
      nodo,
    );
  }

  /**
   * Top. Cada bloque se pide por sus dos cortes (territorio y unidad) de forma
   * intercalada: es el orden en que el legado los apila en pantalla.
   */
  top(nodo: NodoConsulta, filtros: Record<string, unknown>): Observable<TablaReporteResultado[]> {
    const bloques = COD_CERO_CUOTAS.top.flatMap((codRep) =>
      CORTES_TOP_CERO_CUOTAS.map((corte) => ({ codRep, extra: { ...filtros, tip_cod2: corte.tip_cod2 } })),
    );
    return this.bloques.regulares(bloques, nodo);
  }

  /** Base de Gestión, con su filtro `tipcuota`. */
  baseGestion(nodo: NodoConsulta, filtros: Record<string, unknown>): Observable<ReporteBloqueUnico> {
    return this.bloques.regularPaginado(COD_BASE_GESTION, nodo, filtros).pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Dashboard en Revisión: dos bloques `table.regular` que alimentan cuatro gráficos. */
  dashboardRevision(nodo: NodoConsulta): Observable<BloqueGrafico[]> {
    const params = { ...this.paramsNodo(nodo), fecha: this.bloques.fecha() };
    const bloques = COD_DASHBOARD_REVISION.map((codRep) => this.reportes.getRegularTableResult(codRep, params));

    return forkJoin(bloques).pipe(
      map((respuestas) => {
        const filasPorBloque = respuestas.map((r) => filasDeResultado(resultadoCrudo(r)));
        return GRAFICOS_DASHBOARD_REVISION.map((config) =>
          graficoDashboardRevision(config, filasPorBloque[config.bloque]),
        ).filter((g) => g.categorias.length > 0);
      }),
    );
  }

  private paramsNodo(nodo: NodoConsulta): Record<string, unknown> {
    return { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel };
  }
}
