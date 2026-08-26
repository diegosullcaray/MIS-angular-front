import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../Captaciones/models/captaciones.model';
import { ClientesSimplesService } from '../../../services/clientes-simples.service';

/** "Clientes Flujo" (`leg/com/rda/adm/cmg_cliente_flujo`) — legado `CMG_CLIF`. */
@Component({
  selector: 'app-cmg-clientes-flujo',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './cmg-clientes-flujo.component.html',
  styleUrl: './cmg-clientes-flujo.component.css',
})
export class CmgClientesFlujoComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ClientesSimplesService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.cmgFlujo(nodo);
  }
}
