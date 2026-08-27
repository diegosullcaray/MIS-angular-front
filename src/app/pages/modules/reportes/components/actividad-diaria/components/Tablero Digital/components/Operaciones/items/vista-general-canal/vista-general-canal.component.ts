import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_MACRO } from '../../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../Captaciones/models/captaciones.model';
import { TableroDigitalService } from '../../../../services/tablero-digital.service';

/**
 * "Vista General" de Operaciones (`leg/com/rda/adm/tab-digital_vr2-ope`) —
 * legado `TABDIG_VR2_01`, host `cra-v1p1`.
 *
 * Jerarquía `MAC_2` (macro sin macrocorredor), no `UNI_1`.
 */
@Component({
  selector: 'app-vista-general-canal',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './vista-general-canal.component.html',
})
export class VistaGeneralCanalComponent extends ReporteSimpleBase {
  private readonly servicio = inject(TableroDigitalService);

  protected readonly paramsHier = PARAMS_HIER_MACRO;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.vistaGeneralCanal(nodo);
  }
}
