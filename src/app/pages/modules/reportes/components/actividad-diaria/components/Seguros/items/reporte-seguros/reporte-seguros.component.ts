import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { SegurosService } from '../../services/seguros.service';

/**
 * "Reporte Seguros" (`leg/com/rda/adm/cam-seguros`) — legado `GRSCMIS`
 * (host `cra-v1p6`), titulado "Reporte de Resumen Seguro" en el routing.
 */
@Component({
  selector: 'app-reporte-seguros',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './reporte-seguros.component.html',
})
export class ReporteSegurosComponent extends ReporteBloquesBase {
  private readonly servicio = inject(SegurosService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  /** `content.higher` de los cuatro bloques activos (`_01`, `_02`, `_04`, `_05`). */
  protected readonly titulos = ['Resumen', 'Detalle por asesor', 'Meta por producto', 'Detalle'];

  /** Solo el `_02` trae `content.lower`. */
  protected override readonly notas = [undefined, '<b>* No se incluyen desembolsos FAE</b>', undefined, undefined];

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.reporteSeguros(nodo);
  }
}
