import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_FC } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../Captaciones/models/captaciones.model';
import { MovilidadService } from '../../services/movilidad.service';

/**
 * "Resumen Movilidad Recuperaciones" (`leg/com/rda/adm/res-mov-rec`) — legado
 * `RESNMOVR`, host `cra-v6`.
 *
 * Único reporte del lote cuya jerarquía no es `UNI_1`: declara `OFI_3`, que en
 * `mod-rep.service.ts` es `{code:4, max_lvl:1}` ("solo FC") — o sea
 * `PARAMS_HIER_FC`, NO `PARAMS_HIER_OFICINA` (que es el `OFI_1`,
 * `{code:2, max_lvl:5}`). Los nombres se parecen; los códigos no.
 */
@Component({
  selector: 'app-resumen-movilidad-recuperaciones',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './resumen-movilidad-recuperaciones.component.html',
  styleUrl: './resumen-movilidad-recuperaciones.component.css',
})
export class ResumenMovilidadRecuperacionesComponent extends ReporteSimpleBase {
  private readonly servicio = inject(MovilidadService);

  protected readonly paramsHier = PARAMS_HIER_FC;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.resumenRecuperaciones(nodo);
  }
}
