import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_OFICINA } from '../../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../Captaciones/models/captaciones.model';
import { TableroDigitalService } from '../../../../services/tablero-digital.service';

/**
 * "Detalle Corresponsales" (`leg/com/rda/adm/det_correspon`) — legado
 * `RDETCORR_01`, host PAGINADO `cra-V10`, jerarquía `OFI_1`.
 *
 * Como el resto de los reportes de ese host, manda `pagen` y el nodo completo:
 * sin eso el backend responde "Resultado vacio para: regularData".
 */
@Component({
  selector: 'app-detalle-corresponsales',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './detalle-corresponsales.component.html',
})
export class DetalleCorresponsalesComponent extends ReporteSimpleBase {
  private readonly servicio = inject(TableroDigitalService);

  protected readonly paramsHier = PARAMS_HIER_OFICINA;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.detalleCorresponsales(nodo);
  }
}
