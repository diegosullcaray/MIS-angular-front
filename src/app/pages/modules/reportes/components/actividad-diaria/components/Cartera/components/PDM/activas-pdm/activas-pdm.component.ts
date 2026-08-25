import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../captaciones/models/captaciones.model';
import { CarteraCraService } from '../../../services/cartera-cra.service';

/** "Activas PDM" — legado `activasPdm`. */
@Component({
  selector: 'app-activas-pdm',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './activas-pdm.component.html',
  styleUrl: './activas-pdm.component.css',
})
export class ActivasPdmComponent extends ReporteSimpleBase {
  private readonly servicio = inject(CarteraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.activasPdm(nodo);
  }
}
