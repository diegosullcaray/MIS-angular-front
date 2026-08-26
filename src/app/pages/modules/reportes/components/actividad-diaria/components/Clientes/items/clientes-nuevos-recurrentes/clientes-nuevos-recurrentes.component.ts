import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../captaciones/models/captaciones.model';
import { ClientesSimplesService } from '../../services/clientes-simples.service';

/** "Clientes Nuevos y Recurrentes" — legado `nuevosRecurrentes`. */
@Component({
  selector: 'app-clientes-nuevos-recurrentes',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './clientes-nuevos-recurrentes.component.html',
  styleUrl: './clientes-nuevos-recurrentes.component.css',
})
export class ClientesNuevosRecurrentesComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ClientesSimplesService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.nuevosRecurrentes(nodo);
  }
}
