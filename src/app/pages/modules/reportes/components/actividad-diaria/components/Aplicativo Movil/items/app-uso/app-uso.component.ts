import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../Captaciones/models/captaciones.model';
import { AplicativoMovilService } from '../../services/aplicativo-movil.service';

/** "Uso de App" (`leg/com/rda/adm/app_uso`) — legado `APP_USO_01`, host `cra-v1p1`. */
@Component({
  selector: 'app-app-uso',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './app-uso.component.html',
})
export class AppUsoComponent extends ReporteSimpleBase {
  private readonly servicio = inject(AplicativoMovilService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.usoApp(nodo);
  }
}
