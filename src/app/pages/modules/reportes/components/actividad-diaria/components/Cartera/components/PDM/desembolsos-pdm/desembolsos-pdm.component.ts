import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../captaciones/models/captaciones.model';
import { CarteraCraService } from '../../../services/cartera-cra.service';

/** "Desembolsos PDM" — legado `desembolsosPdm`. */
@Component({
  selector: 'app-desembolsos-pdm',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './desembolsos-pdm.component.html',
  styleUrl: './desembolsos-pdm.component.css',
})
export class DesembolsosPdmComponent extends ReporteSimpleBase {
  private readonly servicio = inject(CarteraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.desembolsosPdm(nodo);
  }
}
