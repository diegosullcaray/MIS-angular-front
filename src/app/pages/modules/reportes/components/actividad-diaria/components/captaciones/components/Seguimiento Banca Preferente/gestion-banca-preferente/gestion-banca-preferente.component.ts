import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../ui/reporte-simple/reporte-simple.base';
import { SelectFiltroComponent } from '../../../../../../../ui/select-filtro/select-filtro.component';
import { PARAMS_HIER_FC } from '../../../../../../../models/jerarquia.model';
import { OPCIONES_PRODUCTO_BP, TODOS } from '../../../../../../../models/filtros.model';
import type { NodoConsulta } from '../../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../models/captaciones.model';
import { SeguimientoBancaPreferenteService } from '../../../../../services/seguimiento-banca-preferente.service';

/** "Seguimiento Captaciones Banca Preferente" (`leg/com/rda/adm/cap-segui-bp`) — legado `CAP_SEGUI_BP`. */
@Component({
  selector: 'app-gestion-banca-preferente',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './gestion-banca-preferente.component.html',
  styleUrl: './gestion-banca-preferente.component.css',
})
export class GestionBancaPreferenteComponent extends ReporteSimpleBase {
  private readonly servicio = inject(SeguimientoBancaPreferenteService);

  protected readonly paramsHier = PARAMS_HIER_FC;
  protected readonly opcionesProducto = OPCIONES_PRODUCTO_BP;
  protected readonly producto = signal<string>(TODOS);

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.bancaPreferente(nodo, this.producto());
  }
}
