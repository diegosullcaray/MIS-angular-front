import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../Captaciones/models/captaciones.model';
import { ComercialEjecutivoService } from '../../services/comercial-ejecutivo.service';

/** "Agro" (`leg/com/rda/adm/agro`) — legado `AGRO`. */
@Component({
  selector: 'app-agro-ejecutivo',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './agro.component.html',
  styleUrl: './agro.component.css',
})
export class AgroEjecutivoComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ComercialEjecutivoService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.agro(nodo);
  }
}
