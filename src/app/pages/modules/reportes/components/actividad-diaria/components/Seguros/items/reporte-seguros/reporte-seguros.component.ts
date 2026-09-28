import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent, type PestanaReporte } from '../../../../../../ui/reporte-simple/reporte-simple.component';
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

  /**
   * Dos pestañas: "Reporte Seguro" agrupa los tres primeros bloques (con
   * chips para elegir cuál ver, al tener más de uno) y "Detalle" el último,
   * solo.
   */
  protected pestanas(): PestanaReporte[] | undefined {
    const bloques = this.bloques();
    if (bloques.length === 0) return undefined;

    return [
      { id: 'reporte', titulo: 'Reporte Seguro', bloques: bloques.slice(0, 3) },
      // Sin título de bloque: repetiría el nombre de la pestaña.
      { id: 'detalle', titulo: 'Detalle', bloques: bloques.slice(3).map((bloque) => ({ ...bloque, titulo: undefined })) },
    ];
  }
}
