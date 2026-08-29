import { Component, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../../models/tabla-reporte.model';
import {
  generarOpcionesFechaBase,
  fechaBasePorDefecto,
} from '../../../../models/actividad-mensual-filtros.model';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';

/** "Ranking de Autonomías de Tasas" (`leg/com/rma/adm/rep-aut-tas`). */
@Component({
  selector: 'app-mensual-ranking-autonomias-tasas',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './ranking-autonomias-tasas.component.html',
  styleUrl: './ranking-autonomias-tasas.component.css',
})
export class RankingAutonomiasTasasComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ActividadMensualCraService);
  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesFechaBase = generarOpcionesFechaBase();
  protected readonly fechaBase = signal<string>(fechaBasePorDefecto());

  protected override consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.rankingAutonomiasTasas(nodo, this.fechaBase());
  }
}
