import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_OFICINA } from '../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../components/Captaciones/models/captaciones.model';
import { ResumenMovilidadService } from '../../services/resumen-movilidad.service';

/**
 * "Resumen de Movilidad Recuperaciones" (`leg/com/rda/adm/res-mov-rec`) —
 * legado `RESNMOVR_01`, host `cra-v6`.
 */
@Component({
  selector: 'app-resumen-movilidad-recuperaciones',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './resumen-movilidad-recuperaciones.component.html',
})
export class ResumenMovilidadRecuperacionesComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ResumenMovilidadService);

  protected readonly paramsHier = PARAMS_HIER_OFICINA;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.recuperaciones(nodo);
  }
}
