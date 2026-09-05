import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_MACRO } from '../../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../../../../models/tabla-reporte.model';
import { TableroDigitalService } from '../../../../services/tablero-digital.service';

/**
 * "Gestión por Canal" (`leg/com/rda/adm/GC-tab-digital_vr2-ope`) — legado
 * `GCTABDIG_VR2_OPE`, host `cra-v1p1`, jerarquía `MAC_2`.
 *
 * OJO con el `id`: su entrada del mapa declara `_02`, no `_01`.
 */
@Component({
  selector: 'app-gestion-canal',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './gestion-canal.component.html',
})
export class GestionCanalComponent extends ReporteSimpleBase {
  private readonly servicio = inject(TableroDigitalService);

  protected readonly paramsHier = PARAMS_HIER_MACRO;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.gestionCanal(nodo);
  }
}
