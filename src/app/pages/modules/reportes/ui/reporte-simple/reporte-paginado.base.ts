import { linkedSignal, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import type { NodoConsulta } from '../../services/bloque-reporte.service';
import type { HierarquiaNodo } from '../../models/jerarquia.model';
import { TABLA_VACIA, type ReporteBloqueUnico, type TablaReporteResultado } from '../../models/tabla-reporte.model';
import { ReporteSimpleBase } from './reporte-simple.base';

/**
 * `ReporteSimpleBase` con paginación en el servidor — el host `report-cra-v10` del legado
 * (`app-table-ajax`): pide la página como `pagen` (desde 1) y el total llega en `additional.Total`.
 *
 * `consultarPagina()` corre dentro del efecto de la base, así que leer `pagina()` ahí basta para
 * que un cambio de página vuelva a consultar. Elegir otro nivel vuelve a la primera página.
 */
export abstract class ReportePaginadoBase extends ReporteSimpleBase {
  protected readonly pagina = signal(1);

  /**
   * Total de filas que declara el backend; `null` si la respuesta no lo trae. Mientras se consulta
   * otra página la base deja la tabla en `TABLA_VACIA`: ahí se conserva el total anterior para que
   * el paginador no desaparezca y vuelva a aparecer en cada cambio de página.
   */
  protected readonly totalFilas = linkedSignal<TablaReporteResultado, number | null>({
    source: () => this.tabla(),
    computation: (tabla, previo) => {
      const total = Number(tabla?.additional?.['Total']);
      if (Number.isFinite(total) && total > 0) return total;
      return tabla === TABLA_VACIA ? (previo?.value ?? null) : null;
    },
  });

  protected abstract consultarPagina(nodo: NodoConsulta, pagina: number): Observable<ReporteBloqueUnico>;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.consultarPagina(nodo, this.pagina());
  }

  protected override onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.pagina.set(1);
    super.onNivelSeleccionado(nodo);
  }
}
