import { Component, inject, signal } from '@angular/core';
import { HierSelectorComponent } from '../../../../../ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../../../ui/tabla-reporte/tabla-reporte.component';
import { EmptyStateComponent } from '../../../../../../../../shared/ui/empty-state/empty-state.component';
import { PARAMS_HIER_OFICINA } from '../../../../../models/jerarquia.model';
import { CmgCaptacionesService } from '../../../services/cmg-captaciones.service';
import { ToastService } from '../../../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../../../utils/hier-selector-error.util';
import { TooltipModule } from 'primeng/tooltip';
import { WindowPanelComponent } from '../../../../../../../../shared/ui/window-panel/window-panel.component';
import type { HierarquiaNodo } from '../../../../../models/jerarquia.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../../models/tabla-reporte.model';

/** "CMG Captaciones - Agencias" — migrado de la ruta `cmg-capta01` (legado STG, `reportes/legacy/comercial/rda/administracion`, `cod_rep: 'GCMGCAP'`). */
@Component({
  selector: 'app-cmg-captaciones',
  standalone: true,
  imports: [HierSelectorComponent, TablaReporteComponent, EmptyStateComponent, TooltipModule, WindowPanelComponent],
  templateUrl: './cmg-captaciones.component.html',
  styleUrl: './cmg-captaciones.component.css',
})
export class CmgCaptacionesComponent {
  private readonly servicio = inject(CmgCaptacionesService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_OFICINA;

  protected readonly mostrarFiltros = signal(true);
  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);

    this.servicio.obtenerCmgCaptaciones({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: ({ tabla1 }) => {
        this.tabla1.set(tabla1);
        this.cargando.set(false);

        if (tabla1.body.length === 0) {
          this.toast.advertencia('Carga en proceso', 'Los datos podrían seguir procesándose en el servidor. Si ves valores en 0, intenta actualizar en unos minutos.');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
