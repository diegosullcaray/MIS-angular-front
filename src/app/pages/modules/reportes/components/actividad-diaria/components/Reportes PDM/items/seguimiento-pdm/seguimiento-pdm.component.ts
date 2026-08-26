import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../Captaciones/models/captaciones.model';
import { ReportesPdmService } from '../../services/reportes-pdm.service';

/** "Seguimiento PDM" (`leg/com/rda/adm/seg_pdm`) — legado `SEG_PDM`. */
@Component({
  selector: 'app-seguimiento-pdm',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './seguimiento-pdm.component.html',
  styleUrl: './seguimiento-pdm.component.css',
})
export class SeguimientoPdmComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ReportesPdmService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.seguimientoPdm(nodo);
  }
}
