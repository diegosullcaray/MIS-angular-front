import { Component, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { ToastService } from '../../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../../utils/hier-selector-error.util';
import { PARAMS_HIER_OFICINA, type HierarquiaNodo } from '../../../../../../models/jerarquia.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { CaptacionPorCanalService } from '../../../Captaciones/services/captacion-por-canal.service';

/** "Captaciones por Canal" (`leg/com/rda/adm/cap-age`) — CAPTACIONES RED. */
@Component({
  selector: 'app-captacion-por-canal',
  standalone: true,
  imports: [HierSelectorComponent, TablaReporteComponent, EmptyStateComponent, WindowPanelComponent],
  templateUrl: './captacion-por-canal.component.html',
})
export class CaptacionPorCanalComponent {
  private readonly servicio = inject(CaptacionPorCanalService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_OFICINA;
  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);

    this.servicio.obtener({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: ({ tabla1 }) => {
        this.tabla1.set(tabla1);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
