import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_MACRO } from '../../../../../../models/jerarquia.model';
import { OPCIONES_PRODUCTO_PASIVO, OPCIONES_SEGMENTO, TODOS } from '../../../../../../models/filtros.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../models/captaciones.model';
import { CaptacionCanalOperacionesService } from '../../services/captacion-canal-operaciones.service';

/** "Captación por Canal Operaciones" (`leg/com/rda/adm/capta-caract-canal-operacional`) — legado `CARACT_pas`. */
@Component({
  selector: 'app-captacion-canal-operaciones',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './captacion-canal-operaciones.component.html',
  styleUrl: './captacion-canal-operaciones.component.css',
})
export class CaptacionCanalOperacionesComponent extends ReporteSimpleBase {
  private readonly servicio = inject(CaptacionCanalOperacionesService);

  protected readonly paramsHier = PARAMS_HIER_MACRO;
  protected readonly opcionesProducto = OPCIONES_PRODUCTO_PASIVO;
  protected readonly opcionesSegmento = OPCIONES_SEGMENTO;
  protected readonly producto = signal<string>(TODOS);
  protected readonly segmento = signal<string>(TODOS);

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.obtener(nodo, this.producto(), this.segmento());
  }
}