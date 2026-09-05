import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_MACRO } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../models/captaciones.model';
import { RecaudosServiciosService } from '../../services/recaudos-servicios.service';

/** "Recaudo de Servicios" (`leg/com/rda/adm/recaudo-serv-pas`) — legado `RECSERV_PAS`. */
@Component({
  selector: 'app-recaudos-servicios',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './recaudos-servicios.component.html',
})
export class RecaudosServiciosComponent extends ReporteSimpleBase {
  private readonly servicio = inject(RecaudosServiciosService);

  protected readonly paramsHier = PARAMS_HIER_MACRO;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.obtener(nodo);
  }
}
