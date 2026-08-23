import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../ui/tabla-reporte/tabla-reporte.component';
import { GruposPorVencerService } from '../../services/grupos-por-vencer.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Grupos por Vencer" — migrado de la ruta `leg/com/rda/sec/pdm` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `rda/sectorista/grupo_pdm/grupo_pdm_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-grupos-por-vencer',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './grupos-por-vencer.component.html',
  styleUrl: './grupos-por-vencer.component.css',
})
export class GruposPorVencerComponent {
  private readonly servicio = inject(GruposPorVencerService);
  private readonly toast = inject(ToastService);


  protected readonly asesores = signal<AsesorSec[]>([]);
  protected readonly asesorSeleccionado = signal<AsesorSec | null>(null);

  protected readonly cargando = signal(false);
  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);

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
    this.servicio.obtenerGruposPorVencer({ tip_cod: 2, cod_rel: asesor.dni }).subscribe({
      next: ({ tabla1 }) => {
        this.tabla1.set(tabla1);
        this.cargando.set(false);

        if (tabla1.body.length === 0) {
          this.toast.advertencia('Sin resultados', 'Este asesor no tiene grupos PDM por vencer.');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
