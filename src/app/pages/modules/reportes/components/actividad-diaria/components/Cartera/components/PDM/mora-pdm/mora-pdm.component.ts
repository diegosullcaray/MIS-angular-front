import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../models/captaciones.model';
import { CarteraCraService } from '../../../services/cartera-cra.service';

/** "Mora PDM" — legado `moraPdm`. */
@Component({
  selector: 'app-mora-pdm',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './mora-pdm.component.html',
  styleUrl: './mora-pdm.component.css',
})
export class MoraPdmComponent extends ReporteSimpleBase {
  private readonly servicio = inject(CarteraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.moraPdm(nodo);
  }
}
