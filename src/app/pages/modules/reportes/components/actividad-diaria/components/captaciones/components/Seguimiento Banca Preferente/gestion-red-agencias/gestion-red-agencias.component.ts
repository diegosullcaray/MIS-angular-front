import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_FC } from '../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../services/bloque-reporte.service';
import { SeguimientoBancaPreferenteService } from '../../../services/seguimiento-banca-preferente.service';
import { ReporteBloqueUnico } from '../../../../captaciones/models/captaciones.model';

/** "Gestión Red de Agencias" (`leg/com/rda/adm/gest-red-ag`) — legado `CAP_SEGUI_FC_BP`. */
@Component({
  selector: 'app-gestion-red-agencias',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './gestion-red-agencias.component.html',
  styleUrl: './gestion-red-agencias.component.css',
})
export class GestionRedAgenciasComponent extends ReporteSimpleBase {
  private readonly servicio = inject(SeguimientoBancaPreferenteService);

  protected readonly paramsHier = PARAMS_HIER_FC;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.redAgencias(nodo);
  }
}
