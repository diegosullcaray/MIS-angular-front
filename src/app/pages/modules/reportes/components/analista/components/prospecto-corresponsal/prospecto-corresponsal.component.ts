import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../ui/tabla-reporte/tabla-reporte.component';
import { AgregarProspectoDialogComponent } from './agregar-prospecto-dialog/agregar-prospecto-dialog.component';
import { ProspectoCorresponsalService } from '../../services/prospecto-corresponsal.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { TooltipModule } from 'primeng/tooltip';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Prospecto Corresponsal" — migrado de la ruta `leg/com/rda/sec/sec-prosp` (legado STG, `reportes/legacy/comercial/rda/sectorista/crs-prospe`, título real "Prospectos Corresponsales", `cod_rep: 'LIS_PROSPE'`). */
@Component({
  selector: 'app-prospecto-corresponsal',
  standalone: true,
  imports: [FormsModule, SelectModule, ButtonModule, SkeletonModule, TablaReporteComponent, AgregarProspectoDialogComponent, TooltipModule, WindowPanelComponent],
  templateUrl: './prospecto-corresponsal.component.html',
  styleUrl: './prospecto-corresponsal.component.css',
})
export class ProspectoCorresponsalComponent {
  private readonly servicio = inject(ProspectoCorresponsalService);
  private readonly toast = inject(ToastService);

  protected readonly mostrarFiltros = signal(false);
  protected readonly dialogoVisible = signal(false);

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
    if (asesor) this.cargarProspectos();
  }

  private cargarProspectos(): void {
    const asesor = this.asesorSeleccionado();
    if (!asesor) return;

    this.cargando.set(true);
    this.servicio.obtenerProspectos({ tip_cod: 2, cod_rel: asesor.dni }).subscribe({
      next: (tabla1) => {
        this.tabla1.set(tabla1);
        this.cargando.set(false);

        if (tabla1.body.length === 0) {
          this.toast.advertencia('Sin resultados', 'Este asesor no tiene prospectos corresponsales registrados.');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar la lista de prospectos', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }

  protected onProspectoGuardado(): void {
    this.toast.exito('Prospecto registrado', 'El prospecto corresponsal se guardó correctamente.');
    this.cargarProspectos();
  }
}
