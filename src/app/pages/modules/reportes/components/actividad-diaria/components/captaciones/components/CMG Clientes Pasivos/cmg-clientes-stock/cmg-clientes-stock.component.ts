import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_OFICINA } from '../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../models/captaciones.model';
import { CmgClientesPasivosService } from '../../../../../services/cmg-clientes-pasivos.service';

/** "CMG Clientes Pasivo Stock" (`leg/com/rda/adm/cmg-cli-pas-stock`) — legado `CMG_CLI_PAS_STOCK`. */
@Component({
  selector: 'app-cmg-clientes-stock',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './cmg-clientes-stock.component.html',
  styleUrl: './cmg-clientes-stock.component.css',
})
export class CmgClientesStockComponent extends ReporteSimpleBase {
  private readonly servicio = inject(CmgClientesPasivosService);

  protected readonly paramsHier = PARAMS_HIER_OFICINA;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.stock(nodo);
  }
}
