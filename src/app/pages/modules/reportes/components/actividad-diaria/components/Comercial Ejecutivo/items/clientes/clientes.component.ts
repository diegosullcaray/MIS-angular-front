import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../../models/tabla-reporte.model';
import { ComercialEjecutivoService } from '../../services/comercial-ejecutivo.service';

/**
 * "Clientes" (`leg/com/rda/adm/cli`) — legado `Clientes`.
 *
 * Ojo: no confundir con el módulo `Clientes` de Actividad Diaria; este reporte
 * es del nodo Comercial Ejecutivo, de ahí el sufijo en el nombre de la clase.
 */
@Component({
  selector: 'app-clientes-ejecutivo',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './clientes.component.html',
})
export class ClientesEjecutivoComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ComercialEjecutivoService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.clientes(nodo);
  }
}
