import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../ui/tabla-reporte/tabla-reporte.component';
import { ClientesNuevosRecurrentesService } from '../../services/clientes-nuevos-recurrentes.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { TooltipModule } from 'primeng/tooltip';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/**
 * "Clientes Nuevos y Recurrentes" — migrado de la ruta `leg/com/rda/sec/cli-nue-rec`
 * (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`,
 * config `rda/sectorista/clientes_nuevos_recurrente/cliente_nuevo_rec` en `crs-map.ts`).
 *
 * Mismo patrón de solo lectura que "Cartera"/"Clientes Producto" (asesor → N
 * tablas, sin pestañas ni formulario), pero con una única tabla.
 */
@Component({
  selector: 'app-clientes-nuevos-recurrentes',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, TooltipModule, WindowPanelComponent],
  templateUrl: './clientes-nuevos-recurrentes.component.html',
  styleUrl: './clientes-nuevos-recurrentes.component.css',
})
export class ClientesNuevosRecurrentesComponent {
  private readonly servicio = inject(ClientesNuevosRecurrentesService);
  private readonly toast = inject(ToastService);

  protected readonly mostrarFiltros = signal(false);

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
    this.servicio.obtenerClientesNuevosRecurrentes({ tip_cod: 2, cod_rel: asesor.dni }).subscribe({
      next: ({ tabla1 }) => {
        this.tabla1.set(tabla1);
        this.cargando.set(false);

        if (tabla1.body.length === 0) {
          this.toast.advertencia('Sin resultados', 'Este asesor no tiene clientes nuevos ni recurrentes, o los datos podrían seguir procesándose.');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
