import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../Captaciones/models/captaciones.model';
import { CarteraMoraCraService } from '../../services/cartera-mora-cra.service';

/**
 * "Reporte de Pago Puntual" (`leg/com/rda/adm/mon-efectramoscomer`) — legado
 * `RS_MON_EFECTRAMOSC` (host `cra-v7`), titulado "Seguimiento Cartera por
 * Tramos Comercial" en el routing y "REPORTE DE PAGO PUNTUAL" en la pantalla.
 */
@Component({
  selector: 'app-reporte-pago-puntual',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './reporte-pago-puntual.component.html',
  styleUrl: './reporte-pago-puntual.component.css',
})
export class ReportePagoPuntualComponent extends ReporteSimpleBase {
  private readonly servicio = inject(CarteraMoraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.reportePagoPuntual(nodo);
  }
}
