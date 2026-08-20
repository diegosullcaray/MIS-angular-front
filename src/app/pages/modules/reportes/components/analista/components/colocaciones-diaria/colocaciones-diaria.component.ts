import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../ui/tabla-reporte/tabla-reporte.component';
import { ColocacionesDiariaService } from '../../services/colocaciones-diaria.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { TooltipModule } from 'primeng/tooltip';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/**
 * "Colocaciones diaria Operación, Monto y Recuperación" — migrado de la ruta
 * `leg/com/rda/sec/proy_M6` (legado STG,
 * `reportes/legacy/support/components/template/crs/report-crs-v1`, config
 * `PROYEC_DIACOLREC_AS` en `crs-map.ts`).
 *
 * Solo lectura: asesor → 3 tablas, cada una con su propio título
 * (`content.higher` del legado).
 */
@Component({
  selector: 'app-colocaciones-diaria',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, TooltipModule, WindowPanelComponent],
  templateUrl: './colocaciones-diaria.component.html',
  styleUrl: './colocaciones-diaria.component.css',
})
export class ColocacionesDiariaComponent {
  private readonly servicio = inject(ColocacionesDiariaService);
  private readonly toast = inject(ToastService);

  protected readonly mostrarFiltros = signal(false);

  protected readonly asesores = signal<AsesorSec[]>([]);
  protected readonly asesorSeleccionado = signal<AsesorSec | null>(null);

  protected readonly cargando = signal(false);
  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla2 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla3 = signal<TablaReporteResultado>(TABLA_VACIA);

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
    this.servicio.obtenerColocacionesDiaria({ tip_cod: 2, cod_rel: asesor.dni }).subscribe({
      next: ({ tabla1, tabla2, tabla3 }) => {
        this.tabla1.set(tabla1);
        this.tabla2.set(tabla2);
        this.tabla3.set(tabla3);
        this.cargando.set(false);

        if ([tabla1, tabla2, tabla3].every((t) => t.body.length === 0)) {
          this.toast.advertencia('Sin resultados', 'Este asesor no tiene datos de colocaciones, o los datos podrían seguir procesándose.');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
