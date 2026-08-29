import { Component, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_OFICINA } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../../models/tabla-reporte.model';
import {
  OPCIONES_CARGA_AMBIENTAL,
  CARGA_AMBIENTAL_POR_DEFECTO,
  generarOpcionesFechaBase,
  fechaBasePorDefecto,
} from '../../../../models/actividad-mensual-filtros.model';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';

/** "Huella Carbono" (`leg/com/rma/adm/huella-carbono-m`). */
@Component({
  selector: 'app-mensual-huella-carbono',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './huella-carbono.component.html',
  styleUrl: './huella-carbono.component.css',
})
export class HuellaCarbonoComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ActividadMensualCraService);
  protected readonly paramsHier = PARAMS_HIER_OFICINA;
  protected readonly opcionesFechaBase = generarOpcionesFechaBase();
  protected readonly fechaBase = signal<string>(fechaBasePorDefecto());
  protected readonly opcionesCargaAmbiental = OPCIONES_CARGA_AMBIENTAL;
  protected readonly cargaAmbiental = signal<string>(CARGA_AMBIENTAL_POR_DEFECTO);

  protected override consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.huellaCarbono(nodo, this.cargaAmbiental(), this.fechaBase());
  }
}
