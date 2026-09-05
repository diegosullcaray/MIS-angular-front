import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../components/Captaciones/models/captaciones.model';
import { ResumenMovilidadService } from '../../services/resumen-movilidad.service';

/**
 * "Resumen de Movilidad Comercial" (`leg/com/rda/adm/res-mov`) — legado
 * `RESNMOV_01`, host PAGINADO `cra-V10`, jerarquía `UNI_1`.
 *
 * No cuelga de ningún sub-nodo del menú, así que vive como item directo de
 * "Actividad Diaria".
 */
@Component({
  selector: 'app-resumen-movilidad-comercial',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './resumen-movilidad-comercial.component.html',
})
export class ResumenMovilidadComercialComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ResumenMovilidadService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.comercial(nodo);
  }
}
