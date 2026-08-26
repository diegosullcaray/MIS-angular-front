import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../Captaciones/models/captaciones.model';
import { CampanasService } from '../../services/campanas.service';

/** "Apadrinamiento" (`leg/com/rda/adm/cam-apa`) — legado `R_APADRINA`, "Tramo 1-30". */
@Component({
  selector: 'app-apadrinamiento',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './apadrinamiento.component.html',
  styleUrl: './apadrinamiento.component.css',
})
export class ApadrinamientoComponent extends ReporteSimpleBase {
  private readonly servicio = inject(CampanasService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.apadrinamiento(nodo);
  }
}
