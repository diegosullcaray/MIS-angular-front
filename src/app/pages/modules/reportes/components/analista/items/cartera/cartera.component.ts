import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { CarteraService } from '../../services/cartera.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { ReporteAsesorBase } from '../../ui/reporte-asesor.base';
import type { ReporteCartera } from '../../models/cartera.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Cartera" — migrado de la ruta `leg/com/rda/sec/cartera` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `rda/sectorista/cartera/cartera_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-cartera',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './cartera.component.html',
})
export class CarteraComponent extends ReporteAsesorBase<ReporteCartera> {
  private readonly servicio = inject(CarteraService);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla2 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected readonly avisoSinResultados = 'Este asesor no tiene clientes en cartera, o los datos podrían seguir procesándose.';
  protected override readonly errorDeCarga = 'No se pudo cargar la cartera';

  protected consultar(asesor: AsesorSec) {
    return this.servicio.obtenerCartera(this.nodoDe(asesor));
  }

  protected recibir({ tabla1, tabla2 }: ReporteCartera): boolean {
    this.tabla1.set(tabla1);
    this.tabla2.set(tabla2);
    return this.sinFilas(tabla1, tabla2);
  }
}
