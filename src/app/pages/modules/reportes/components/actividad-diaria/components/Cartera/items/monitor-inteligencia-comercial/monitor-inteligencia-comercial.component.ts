import { Component, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../../ui/hier-selector/hier-selector.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_UNIDAD, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import type { ColumnaMonitor } from '../../models/monitor-inteligencia.model';
import { CarteraRepositorioService } from '../../services/cartera-repositorio.service';

/** "Monitor de Inteligencia de Negocios" (`repositorio/actividad-diaria/mon-comercial/Monincome`). */
@Component({
  selector: 'app-monitor-inteligencia-comercial',
  standalone: true,
  imports: [HierSelectorComponent, EmptyStateComponent, WindowPanelComponent],
  templateUrl: './monitor-inteligencia-comercial.component.html',
  styleUrl: './monitor-inteligencia-comercial.component.css',
})
export class MonitorInteligenciaComercialComponent {
  private readonly servicio = inject(CarteraRepositorioService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly columnas = signal<ColumnaMonitor[]>([]);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);

    this.servicio.monitorInteligencia({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: (columnas) => {
        this.columnas.set(columnas);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
