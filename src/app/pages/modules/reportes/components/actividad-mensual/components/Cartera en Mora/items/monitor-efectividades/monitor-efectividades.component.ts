import { Component, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import {
  generarOpcionesFechaBase,
  fechaBasePorDefecto,
} from '../../../../models/actividad-mensual-filtros.model';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';

/** "Monitor Efectividades" (`leg/com/rma/adm/mon-efec`). */
@Component({
  selector: 'app-mensual-monitor-efectividades',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './monitor-efectividades.component.html',
  styleUrl: './monitor-efectividades.component.css',
})
export class MonitorEfectividadesComponent extends ReporteBloquesBase {
  private readonly servicio = inject(ActividadMensualCraService);
  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesFechaBase = generarOpcionesFechaBase();
  protected readonly fechaBase = signal<string>(fechaBasePorDefecto());

  protected override readonly titulos = [
    'MONITOR DE EFECTIVIDADES',
    'MONITOR DE EFECTIVIDADES (DETALLE)',
    'Resumen de Gestiones Ingresadas en Tramo -30-0: Operaciones Deterioradas',
    'Resumen de Gestiones Ingresadas en Tramo 1-30',
  ] as const;

  protected override consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.monitorEfectividades(nodo, this.fechaBase());
  }
}
