import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_OFICINA } from '../../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../Captaciones/models/captaciones.model';
import { TableroDigitalService } from '../../../../services/tablero-digital.service';

/**
 * "Vista General" de Corresponsal (`leg/com/rda/adm/v-general-cor`) — legado
 * `RVIUWGCOR_01`, host `cra-v1p1`, jerarquía `OFI_1`.
 *
 * OJO: la jerarquía es `OFI_1` (oficinas), NO `OFI_3` ("solo FC"), pese a estar
 * en el sub-nodo Corresponsal.
 */
@Component({
  selector: 'app-vista-general-corresponsal',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './vista-general-corresponsal.component.html',
})
export class VistaGeneralCorresponsalComponent extends ReporteSimpleBase {
  private readonly servicio = inject(TableroDigitalService);

  protected readonly paramsHier = PARAMS_HIER_OFICINA;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.vistaGeneralCorresponsal(nodo);
  }
}
