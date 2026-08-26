import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../Captaciones/models/captaciones.model';
import { CampanasService } from '../../services/campanas.service';

/** "Reporte Mentoring" (`leg/com/rda/adm/RMentoring`) — legado `RMENTORIN` (host `cra-v1p7`). */
@Component({
  selector: 'app-mentoring',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './mentoring.component.html',
  styleUrl: './mentoring.component.css',
})
export class MentoringComponent extends ReporteSimpleBase {
  private readonly servicio = inject(CampanasService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.mentoring(nodo);
  }
}
