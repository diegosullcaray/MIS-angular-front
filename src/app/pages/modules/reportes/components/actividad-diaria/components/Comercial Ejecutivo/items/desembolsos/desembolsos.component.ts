import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../Captaciones/models/captaciones.model';
import { ComercialEjecutivoService } from '../../services/comercial-ejecutivo.service';

/** "Desembolsos" (`leg/com/rda/adm/desem-reacfae`) — legado `DESEMBOLSOS`, titulado "DESEMBOLSOS SIN FAE NI REACTIVA". */
@Component({
  selector: 'app-desembolsos-ejecutivo',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './desembolsos.component.html',
  styleUrl: './desembolsos.component.css',
})
export class DesembolsosEjecutivoComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ComercialEjecutivoService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.desembolsos(nodo);
  }
}
