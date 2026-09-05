import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { CarteraService } from '../../services/cartera.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Cartera" — migrado de la ruta `leg/com/rda/sec/cartera` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `rda/sectorista/cartera/cartera_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-cartera',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './cartera.component.html',
})
export class CarteraComponent {
  private readonly servicio = inject(CarteraService);
  private readonly toast = inject(ToastService);


  protected readonly asesores = signal<AsesorSec[]>([]);
  protected readonly asesorSeleccionado = signal<AsesorSec | null>(null);

  protected readonly cargando = signal(false);
  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla2 = signal<TablaReporteResultado>(TABLA_VACIA);

  constructor() {
    this.cargarAsesores();
  }

  private cargarAsesores(): void {
    this.servicio.obtenerAsesores().subscribe({
      next: (asesores) => this.asesores.set(asesores),
      error: () => this.toast.error('No se pudo cargar la lista de asesores', 'Inténtalo de nuevo en unos segundos.'),
    });
  }

  protected onAsesorSeleccionado(asesor: AsesorSec | null): void {
    this.asesorSeleccionado.set(asesor);
    if (!asesor) return;

    this.cargando.set(true);
    this.servicio.obtenerCartera({ tip_cod: 2, cod_rel: asesor.dni }).subscribe({
      next: ({ tabla1, tabla2 }) => {
        this.tabla1.set(tabla1);
        this.tabla2.set(tabla2);
        this.cargando.set(false);

        if (tabla1.body.length === 0 && tabla2.body.length === 0) {
          this.toast.advertencia('Sin resultados', 'Este asesor no tiene clientes en cartera, o los datos podrían seguir procesándose.');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar la cartera', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
