import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../Captaciones/models/captaciones.model';
import { ClientesSimplesService } from '../../../services/clientes-simples.service';

/** "Stock de Clientes" (`leg/com/rda/adm/cmg-cli`) — legado `rda/administracion/clientes/cmg_cliente`. */
@Component({
  selector: 'app-cmg-clientes-stock',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './cmg-clientes-stock.component.html',
  styleUrl: './cmg-clientes-stock.component.css',
})
export class CmgClientesStockComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ClientesSimplesService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.cmgStock(nodo);
  }
}
