import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../ui/reporte-simple/reporte-simple.component';
import { ReportePaginadoBase } from '../../../../ui/reporte-simple/reporte-paginado.base';
import { PARAMS_HIER_UNIDAD } from '../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../components/Captaciones/models/captaciones.model';
import { ResumenMovilidadService } from '../../services/resumen-movilidad.service';

/**
 * "Resumen de Movilidad Comercial" — legado `RESNMOV_01`, host paginado `cra-V10`, jerarquía `UNI_1`.
 * Paginado en el servidor de a 30 filas, como el `app-table-ajax` del legado. Cuelga directo de
 * "Actividad Diaria", sin sub-nodo en el menú.
 */
@Component({
  selector: 'app-resumen-movilidad-comercial',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './resumen-movilidad-comercial.component.html',
})
export class ResumenMovilidadComercialComponent extends ReportePaginadoBase {
  private readonly servicio = inject(ResumenMovilidadService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultarPagina(nodo: NodoConsulta, pagina: number): Observable<ReporteBloqueUnico> {
    return this.servicio.comercial(nodo, pagina);
  }
}
