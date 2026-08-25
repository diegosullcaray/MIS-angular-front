import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../ui/reporte-simple/reporte-simple.base';
import { SelectFiltroComponent } from '../../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_OFICINA } from '../../../../../../../models/jerarquia.model';
import {
  GRUPO_CMG_POR_DEFECTO,
  OPCIONES_GRUPO_CMG,
  OPCIONES_VARIABLE_CMG,
  VARIABLE_CMG_POR_DEFECTO,
} from '../../../../../../../models/filtros.model';
import type { NodoConsulta } from '../../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../models/captaciones.model';
import { CmgClientesPasivosService } from '../../../../../services/cmg-clientes-pasivos.service';

/** "CMG Clientes Pasivo Detalle" (`leg/com/rda/adm/cmg-cli-pas-detalle`) — legado `CMG_CLI_PAS_DETA`. */
@Component({
  selector: 'app-cmg-clientes-flujo-detalle',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './cmg-clientes-flujo-detalle.component.html',
  styleUrl: './cmg-clientes-flujo-detalle.component.css',
})
export class CmgClientesFlujoDetalleComponent extends ReporteSimpleBase {
  private readonly servicio = inject(CmgClientesPasivosService);

  protected readonly paramsHier = PARAMS_HIER_OFICINA;
  protected readonly opcionesVariable = OPCIONES_VARIABLE_CMG;
  protected readonly opcionesGrupo = OPCIONES_GRUPO_CMG;
  protected readonly variable = signal<string>(VARIABLE_CMG_POR_DEFECTO);
  protected readonly grupo = signal<string>(GRUPO_CMG_POR_DEFECTO);

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.flujoDetalle(nodo, this.variable(), this.grupo());
  }
}
