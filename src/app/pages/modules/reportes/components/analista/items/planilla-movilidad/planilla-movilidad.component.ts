import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TabsModule } from 'primeng/tabs';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { PlanillaMovilidadService } from '../../services/planilla-movilidad.service';
import { fechaUltimoDia } from '../../../../utils/fecha-reporte.util';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import { CRITERIOS_MOVILIDAD, type ReportePlanillaMovilidad } from '../../models/planilla-movilidad.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Planilla de Movilidad" — migrado de la ruta `leg/com/rda/sec/plan-mov-sec` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v5`, config `PLANMOV` en `crs-map.ts`). */
@Component({
  selector: 'app-planilla-movilidad',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TabsModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './planilla-movilidad.component.html',
})
export class PlanillaMovilidadComponent extends ReporteAsesorBase<ReportePlanillaMovilidad> {
  private readonly servicio = inject(PlanillaMovilidadService);

  protected readonly periodo = this.formatearPeriodo(fechaUltimoDia());
  protected readonly tabCascada = signal('cascada');
  protected readonly criteriosMovilidad = CRITERIOS_MOVILIDAD;

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla2 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla3 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla4 = signal<TablaReporteResultado>(TABLA_VACIA);

  private formatearPeriodo(fechaYYYYMMDD: string): string {
    return `${fechaYYYYMMDD.slice(6, 8)}/${fechaYYYYMMDD.slice(4, 6)}/${fechaYYYYMMDD.slice(0, 4)}`;
  }

  protected readonly avisoSinResultados = 'Este asesor no tiene planilla de movilidad para el período, o los datos podrían seguir procesándose.';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerPlanillaMovilidad(this.nodoDe(asesor));
  }

  protected recibir({ tabla1, tabla2, tabla3, tabla4 }: ReportePlanillaMovilidad): boolean {
    this.tabla1.set(tabla1);
    this.tabla2.set(tabla2);
    this.tabla3.set(tabla3);
    this.tabla4.set(tabla4);
    return this.sinFilas(tabla1, tabla2, tabla3, tabla4);
  }
}
