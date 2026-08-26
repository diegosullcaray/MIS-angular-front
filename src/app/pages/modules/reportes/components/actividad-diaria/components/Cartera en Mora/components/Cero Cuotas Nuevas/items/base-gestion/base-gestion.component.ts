import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../../ui/reporte-simple/reporte-simple.base';
import { SelectFiltroComponent } from '../../../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_UNIDAD } from '../../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../Captaciones/models/captaciones.model';
import { OPCIONES_TIPO_CUOTA_BASE, TIPO_CUOTA_BASE_POR_DEFECTO } from '../../../../models/cartera-en-mora.model';
import { CeroCuotasNuevasService } from '../../../../services/cero-cuotas-nuevas.service';

/**
 * "Base de Gestión" de Cero Cuotas Nuevas (`leg/com/rda/adm/list-cero-cuotas`)
 * — legado `LCCUOTANUEVA`, del host paginado `report-cra-V10`.
 *
 * Su `tipcuota` NO usa los mismos ids que el de "Cuadro de Mando"/"Top": acá el
 * legado declara `VariableNIngresoD()`, que filtra por texto (`Nuevo`/`Mantiene`).
 */
@Component({
  selector: 'app-cero-cuotas-base-gestion',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './base-gestion.component.html',
  styleUrl: './base-gestion.component.css',
})
export class CeroCuotasBaseGestionComponent extends ReporteSimpleBase {
  private readonly servicio = inject(CeroCuotasNuevasService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly opcionesTipo = OPCIONES_TIPO_CUOTA_BASE;
  protected readonly tipo = signal(TIPO_CUOTA_BASE_POR_DEFECTO);

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.baseGestion(nodo, { tipcuota: this.tipo() });
  }
}
