import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../../models/tabla-reporte.model';
import { CarteraMoraCraService } from '../../services/cartera-mora-cra.service';

/**
 * "Efectividades Sin Asignar" (`leg/com/rda/adm/mon-efec-sinasig`) — legado
 * `RMESA`, del host paginado `report-cra-V10`.
 */
@Component({
  selector: 'app-efectividades-sin-asignar',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './efectividades-sin-asignar.component.html',
})
export class EfectividadesSinAsignarComponent extends ReporteSimpleBase {
  private readonly servicio = inject(CarteraMoraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.efectividadesSinAsignar(nodo);
  }
}
