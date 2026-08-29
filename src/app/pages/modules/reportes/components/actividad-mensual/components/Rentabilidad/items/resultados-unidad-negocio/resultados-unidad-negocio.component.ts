import { Component, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../../models/tabla-reporte.model';
import {
  OPCIONES_CANAL_RED,
  CANAL_RED_POR_DEFECTO,
  generarOpcionesFechaBase,
  fechaBasePorDefecto,
} from '../../../../models/actividad-mensual-filtros.model';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';

/** "Resultados por Unidad de Negocio" (`leg/com/rma/adm/res-un`). */
@Component({
  selector: 'app-mensual-resultados-unidad-negocio',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './resultados-unidad-negocio.component.html',
  styleUrl: './resultados-unidad-negocio.component.css',
})
export class ResultadosUnidadNegocioComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ActividadMensualCraService);
  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesCanal = OPCIONES_CANAL_RED;
  protected readonly canal = signal<string>(CANAL_RED_POR_DEFECTO);
  protected readonly opcionesFechaBase = generarOpcionesFechaBase();
  protected readonly fechaBase = signal<string>(fechaBasePorDefecto());

  protected override consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.resultadosUnidadNegocio(nodo, this.canal(), this.fechaBase());
  }
}
