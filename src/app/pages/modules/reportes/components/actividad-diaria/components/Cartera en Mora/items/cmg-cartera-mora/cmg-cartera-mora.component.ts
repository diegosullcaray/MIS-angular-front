import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../Captaciones/models/captaciones.model';
import { CarteraMoraCraService } from '../../services/cartera-mora-cra.service';

/** "CMG Cartera en Mora" (`leg/com/rda/adm/cmg-mora`) — legado `cuadro_Variable_Riesgo`, título "MORA". */
@Component({
  selector: 'app-cmg-cartera-mora',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './cmg-cartera-mora.component.html',
  styleUrl: './cmg-cartera-mora.component.css',
})
export class CmgCarteraMoraComponent extends ReporteSimpleBase {
  private readonly servicio = inject(CarteraMoraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.cmgMora(nodo);
  }
}
