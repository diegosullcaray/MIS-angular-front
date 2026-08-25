import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../ui/tabla-reporte/tabla-reporte.component';
import { CampanaAgilService } from '../../services/campana-agil.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { OPCIONES_SEMANA, SEMANA_POR_DEFECTO } from '../../models/campana-agil.model';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** "Campaña Ágil" — migrado de la ruta `leg/com/rda/sec/cam-agl` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v1`, config `rda/sectorista/campania_agil/campana_agil_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-campana-agil',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, WindowPanelComponent],
  templateUrl: './campana-agil.component.html',
  styleUrl: './campana-agil.component.css',
})
export class CampanaAgilComponent {
  private readonly servicio = inject(CampanaAgilService);
  private readonly toast = inject(ToastService);

  protected readonly opcionesSemana = OPCIONES_SEMANA;


  protected readonly asesores = signal<AsesorSec[]>([]);
  protected readonly asesorSeleccionado = signal<AsesorSec | null>(null);
  protected readonly semana = signal(SEMANA_POR_DEFECTO);

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
    if (asesor) this.cargarCampanaAgil();
  }

  protected onSemanaSeleccionada(semana: number): void {
    this.semana.set(semana);
    if (this.asesorSeleccionado()) this.cargarCampanaAgil();
  }

  private cargarCampanaAgil(): void {
    const asesor = this.asesorSeleccionado();
    if (!asesor) return;

    this.cargando.set(true);
    this.servicio.obtenerCampanaAgil({ tip_cod: 2, cod_rel: asesor.dni }, this.semana()).subscribe({
      next: ({ tabla1 }) => {
        this.tabla1.set(tabla1);
        this.cargando.set(false);

        if (tabla1.body.length === 0) {
          this.toast.advertencia('Sin resultados', 'Este asesor no tiene datos de campaña ágil para la semana elegida.');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
