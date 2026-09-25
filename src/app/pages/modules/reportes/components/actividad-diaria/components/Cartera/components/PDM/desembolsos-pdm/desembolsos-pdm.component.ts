import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReportePaginadoBase } from '../../../../../../../ui/reporte-simple/reporte-paginado.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../services/bloque-reporte.service';
import { CarteraCraService } from '../../../services/cartera-cra.service';
import type { ReporteBloqueUnico } from '../../../../../../../models/tabla-reporte.model';

/** "Desembolsos PDM" — legado `desembolsosPdm`. */
@Component({
  selector: 'app-desembolsos-pdm',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './desembolsos-pdm.component.html',
})
export class DesembolsosPdmComponent extends ReportePaginadoBase {
  private readonly servicio = inject(CarteraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultarPagina(nodo: NodoConsulta, pagina: number): Observable<ReporteBloqueUnico> {
    return this.servicio.desembolsosPdm(nodo, pagina);
  }
}
