import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../Captaciones/models/captaciones.model';
import { ComercialEjecutivoService } from '../../services/comercial-ejecutivo.service';

/** "PDM" (`leg/com/rda/adm/pdm`) — legado `PDM`. */
@Component({
  selector: 'app-pdm-ejecutivo',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './pdm.component.html',
  styleUrl: './pdm.component.css',
})
export class PdmEjecutivoComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ComercialEjecutivoService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.pdm(nodo);
  }
}
