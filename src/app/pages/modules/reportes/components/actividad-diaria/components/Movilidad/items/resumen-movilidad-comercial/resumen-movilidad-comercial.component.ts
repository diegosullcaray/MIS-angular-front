import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../Captaciones/models/captaciones.model';
import { MovilidadService } from '../../services/movilidad.service';

/** "Resumen Movilidad Comercial" (`leg/com/rda/adm/res-mov`) — legado `RESNMOV`, host paginado `cra-V10`. */
@Component({
  selector: 'app-resumen-movilidad-comercial',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './resumen-movilidad-comercial.component.html',
  styleUrl: './resumen-movilidad-comercial.component.css',
})
export class ResumenMovilidadComercialComponent extends ReporteSimpleBase {
  private readonly servicio = inject(MovilidadService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.resumenComercial(nodo);
  }
}
