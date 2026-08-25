import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { GraficoMixtoComponent } from '../../../../../../../shared/ui/graficos/grafico-mixto/grafico-mixto.component';
import { InversionStockMoraService } from '../../services/inversion-stock-mora.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import type { BloqueGrafico } from '../../../../../../../shared/ui/graficos/models/grafico-comun.model';

/** "Inversión y Stock de Mora" — migrado de la ruta `leg/com/rda/sec/inv-stk` (legado STG, `reportes/legacy/support/components/template/crs/report-crs-v2`, config `rda/sectorista/brecha/brecha_inversion_sec` en `crs-map.ts`). */
@Component({
  selector: 'app-inversion-stock-mora',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, GraficoMixtoComponent, WindowPanelComponent],
  templateUrl: './inversion-stock-mora.component.html',
  styleUrl: './inversion-stock-mora.component.css',
})
export class InversionStockMoraComponent {
  private readonly servicio = inject(InversionStockMoraService);
  private readonly toast = inject(ToastService);


  protected readonly asesores = signal<AsesorSec[]>([]);
  protected readonly asesorSeleccionado = signal<AsesorSec | null>(null);

  protected readonly cargando = signal(false);
  protected readonly graficos = signal<BloqueGrafico[]>([]);

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
    this.servicio.obtenerGraficos({ tip_cod: 2, cod_rel: asesor.dni }).subscribe({
      next: ({ graficos }) => {
        this.graficos.set(graficos);
        this.cargando.set(false);

        if (graficos.length === 0) {
          this.toast.advertencia('Sin resultados', 'Este asesor no tiene datos de inversión y stock de mora.');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
