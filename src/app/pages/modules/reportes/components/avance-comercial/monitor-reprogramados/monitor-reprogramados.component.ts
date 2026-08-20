import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HierSelectorComponent } from '../../../ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../ui/tabla-reporte/tabla-reporte.component';
import { EmptyStateComponent } from '../../../../../../shared/ui/empty-state/empty-state.component';
import { PARAMS_HIER_UNIDAD } from '../../../models/jerarquia.model';
import { AvanceComercialService } from '../../../services/avance-comercial.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { crearManejadorErrorJerarquia } from '../../../utils/hier-selector-error.util';
import { OPCIONES_TIPO_MON_REP } from '../../../models/avance-comercial/avance-comercial.model';
import { TooltipModule } from 'primeng/tooltip';
import { WindowPanelComponent } from '../../../../../../shared/ui/window-panel/window-panel.component';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../models/tabla-reporte.model';

/**
 * "Monitor Reprogramados" — migrado de la ruta `mon-rep` (legado STG,
 * `reportes/legacy/comercial/rda/administracion`, `cod_rep: 'RS_MON_REP'`).
 *
 * La carga la dispara únicamente `app-hier-selector` (evento
 * `nodoSeleccionado`) — igual que `ReportCraV1p1Component` en el legado, que
 * no hace su propio `getBaseHierarchy()`: solo reacciona a `(onSelectHier)`
 * de `hier-rem-selector`. Tener acá un fetch inicial propio duplicaría la
 * llamada a `obtenerJerarquiaBase`.
 *
 * El selector emite la raíz al terminar de cargarla, así que al entrar ya se
 * ve el reporte del total y desde ahí se baja de a un nivel — como el legado.
 * Lo que NO hace es cascadear hasta el fondo: los niveles siguientes se
 * ofrecen sin preselección, para no terminar mostrando el reporte de una
 * agencia cualquiera.
 */
@Component({
  selector: 'app-monitor-reprogramados',
  standalone: true,
  imports: [HierSelectorComponent, TablaReporteComponent, EmptyStateComponent, SelectModule, FormsModule, SkeletonModule, ProgressSpinnerModule, TooltipModule, WindowPanelComponent],
  templateUrl: './monitor-reprogramados.component.html',
  styleUrl: './monitor-reprogramados.component.css',
})
export class MonitorReprogramadosComponent {
  private readonly servicio = inject(AvanceComercialService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesTipo = OPCIONES_TIPO_MON_REP;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);

  /** Los filtros arrancan plegados: al entrar ya se ve el reporte de la raíz. */
  protected readonly mostrarFiltros = signal(false);
  protected readonly tipoSeleccionado = signal<1 | 2>(1);
  protected readonly cargando = signal(false);
  protected readonly tablaReprogramados = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargarReporte();
  }

  protected onTipoSeleccionado(tipo: 1 | 2): void {
    this.tipoSeleccionado.set(tipo);
    if (this.nivelActual()) this.cargarReporte();
  }

  private cargarReporte(): void {
    const nivel = this.nivelActual();
    if (!nivel) return;

    this.cargando.set(true);
    this.servicio
      .obtenerMonitorReprogramados({ tip_cod: nivel.tip_cod, cod_rel: nivel.cod_rel }, this.tipoSeleccionado())
      .subscribe({
        next: (resultado) => {
          this.tablaReprogramados.set(resultado);
          this.cargando.set(false);

          if (resultado.body.length === 0) {
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
