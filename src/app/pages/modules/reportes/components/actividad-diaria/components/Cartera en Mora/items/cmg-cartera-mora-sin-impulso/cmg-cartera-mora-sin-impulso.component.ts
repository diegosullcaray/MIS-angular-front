import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../../models/tabla-reporte.model';
import { CarteraMoraCraService } from '../../services/cartera-mora-cra.service';

/** "CMG Cartera en Mora Sin Impulso" (`leg/com/rda/adm/cmg-mora-simp`) — legado `cmg_mora_simp`, título "MORA SIN IMPULSO". */
@Component({
  selector: 'app-cmg-cartera-mora-sin-impulso',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './cmg-cartera-mora-sin-impulso.component.html',
})
export class CmgCarteraMoraSinImpulsoComponent extends ReporteSimpleBase {
  private readonly servicio = inject(CarteraMoraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.cmgMoraSinImpulso(nodo);
  }
}
