import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../../models/tabla-reporte.model';
import { CarteraMoraCraService } from '../../services/cartera-mora-cra.service';

/**
 * "Seguimiento Reprogramados" (`leg/com/rda/adm/mon-efecrepro`) — legado
 * `RS_MON_EFECREPRO` (host `cra-v7`), que sale de `com-map.module.ts` y por eso
 * va por el strand deprecado.
 */
@Component({
  selector: 'app-seguimiento-reprogramados',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './seguimiento-reprogramados.component.html',
})
export class SeguimientoReprogramadosComponent extends ReporteSimpleBase {
  private readonly servicio = inject(CarteraMoraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.seguimientoReprogramados(nodo);
  }
}
