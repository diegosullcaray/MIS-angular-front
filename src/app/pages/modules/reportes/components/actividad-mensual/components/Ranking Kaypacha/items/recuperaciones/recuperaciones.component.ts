import { Component, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_FC } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../../models/tabla-reporte.model';
import {
  generarOpcionesFechaBase,
  fechaBasePorDefecto,
} from '../../../../models/actividad-mensual-filtros.model';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';

/** "Ranking Kaypacha Recuperaciones" (`leg/com/rma/adm/rank-kay-recu`). */
@Component({
  selector: 'app-mensual-ranking-kaypacha-recuperaciones',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './recuperaciones.component.html',
  styleUrl: './recuperaciones.component.css',
})
export class RankingKaypachaRecuperacionesComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ActividadMensualCraService);
  protected readonly paramsHier = PARAMS_HIER_FC;
  protected readonly opcionesFechaBase = generarOpcionesFechaBase();
  protected readonly fechaBase = signal<string>(fechaBasePorDefecto());

  protected override consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.rankingKaypachaRecuperaciones(nodo, this.fechaBase());
  }
}
