import { Component, computed, inject, signal } from '@angular/core';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { HierSelectorComponent } from '../../../ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../ui/tabla-reporte/tabla-reporte.component';
import { EmptyStateComponent } from '../../../../../../shared/ui/empty-state/empty-state.component';
import { PARAMS_HIER_UNIDAD } from '../../../models/jerarquia.model';
import { AvanceComercialService } from '../../../services/avance-comercial.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import { crearManejadorErrorJerarquia } from '../../../utils/hier-selector-error.util';
import { TooltipModule } from 'primeng/tooltip';
import { WindowPanelComponent } from '../../../../../../shared/ui/window-panel/window-panel.component';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';
import type { KpiMontoDesembolsado, KpiOperacionesDesembolsadas } from '../../../models/avance-comercial/avance-comercial.model';

const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };

/**
 * "Monitor Metas Desembolso" — migrado de la ruta `mon-desem` (legado STG,
 * `reportes/legacy/comercial/rda/administracion`, `cod_rep: 'Monitor_Dese'`).
 *
 * La carga inicial la dispara únicamente `app-hier-selector` (evento
 * `nodoSeleccionado`) — igual que `ReportCraV1p1Component` en el legado,
 * que no hace su propio `getBaseHierarchy()`: solo reacciona a
 * `(onSelectHier)` de `hier-rem-selector`. Tener acá un fetch inicial propio
 * duplicaba la llamada a `obtenerJerarquiaBase` y competía en carrera con el
 * cascadeo interno del selector (root → nivel por nivel hasta `maxLvl`), que
 * también dispara `onNivelSeleccionado` en cada paso.
 */
@Component({
  selector: 'app-monitor-metas-desembolso',
  standalone: true,
  imports: [HierSelectorComponent, TablaReporteComponent, EmptyStateComponent, SkeletonModule, ProgressSpinnerModule, TooltipModule, WindowPanelComponent],
  templateUrl: './monitor-metas-desembolso.component.html',
  styleUrl: './monitor-metas-desembolso.component.css',
})
export class MonitorMetasDesembolsoComponent {
  private readonly servicio = inject(AvanceComercialService);
  private readonly toast = inject(ToastService);
  private readonly mensajes = inject(MessageService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);

  /**
   * Colapsado por defecto una vez que hay reporte a la vista, para no restarle
   * espacio a las tablas. Pero mientras no se eligió ningún nivel, el selector
   * de jerarquía —que vive ahí adentro— es la ÚNICA forma de ver algo: forzarlo
   * visible evita quedar en "Elige un nivel de la jerarquía" sin ver cómo.
   */
  protected readonly filtrosAbiertos = signal(false);
  protected readonly mostrarFiltros = computed(() => !this.nivelActual() || this.filtrosAbiertos());
  protected readonly cargando = signal(false);
  protected readonly onErrorJerarquia = crearManejadorErrorJerarquia(this.toast, this.cargando);

  protected readonly kpiOperaciones = signal<KpiOperacionesDesembolsadas | null>(null);
  protected readonly kpiMonto = signal<KpiMontoDesembolsado | null>(null);
  protected readonly tabla1 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla2 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla3 = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tabla4 = signal<TablaReporteResultado>(TABLA_VACIA);

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);

    this.servicio.obtenerMonitorMetasDesembolso({ tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel }).subscribe({
      next: ({ kpiOperaciones, kpiMonto, tabla1, tabla2, tabla3, tabla4 }) => {
        this.kpiOperaciones.set(kpiOperaciones);
        this.kpiMonto.set(kpiMonto);
        this.tabla1.set(tabla1);
        this.tabla2.set(tabla2);
        this.tabla3.set(tabla3);
        this.tabla4.set(tabla4);
        this.cargando.set(false);

        // eslint-disable-next-line no-console
        console.log('[DEBUG headers tabla1]', JSON.stringify(tabla1.headers, null, 2));
        // eslint-disable-next-line no-console
        console.log('[DEBUG headers tabla2]', JSON.stringify(tabla2.headers, null, 2));
        // eslint-disable-next-line no-console
        console.log('[DEBUG headers tabla3]', JSON.stringify(tabla3.headers, null, 2));
        // eslint-disable-next-line no-console
        console.log('[DEBUG headers tabla4]', JSON.stringify(tabla4.headers, null, 2));

        if ([tabla1, tabla2, tabla3, tabla4].every((t) => t.body.length === 0)) {
          this.mensajes.warn(
            'Los datos podrían seguir procesándose en el servidor. Si ves valores en 0, intenta actualizar en unos minutos.',
            'Carga en proceso',
          );
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
