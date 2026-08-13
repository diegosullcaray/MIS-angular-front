import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { HierSelectorComponent } from '../../../../presupuesto/ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../ui/tabla-reporte/tabla-reporte.component';
import { ReportesService, PARAMS_HIER_UNIDAD } from '../../../services/reportes.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import { crearManejadorErrorJerarquia } from '../../../utils/hier-selector-error.util';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';
import type { KpiMontoDesembolsado, KpiOperacionesDesembolsadas } from '../../../models/monitor-metas-desembolso.model';

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
  imports: [HierSelectorComponent, TablaReporteComponent, SkeletonModule, ProgressSpinnerModule, ButtonModule],
  templateUrl: './monitor-metas-desembolso.component.html',
  styleUrl: './monitor-metas-desembolso.component.css',
})
export class MonitorMetasDesembolsoComponent {
  private readonly reportes = inject(ReportesService);
  private readonly toast = inject(ToastService);
  private readonly mensajes = inject(MessageService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly mostrarFiltros = signal(true);

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(true);
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

    const nivel = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel };

    forkJoin({
      t1: this.reportes.obtenerBloqueReporte('Monitor_Dese_01', { ...nivel, tipmet: 1 }),
      t2: this.reportes.obtenerBloqueReporte('Monitor_Dese_02', { ...nivel, tipmet: 1 }),
      t3: this.reportes.obtenerBloqueReporte('Monitor_Dese_03', { ...nivel, tipmet: 1 }),
      t4: this.reportes.obtenerBloqueReporte('Monitor_Dese_04', nivel),
    }).subscribe({
      next: ({ t1, t2, t3, t4 }) => {
        this.kpiOperaciones.set((t1.additional as unknown as KpiOperacionesDesembolsadas | undefined) ?? null);
        this.kpiMonto.set((t2.additional as unknown as KpiMontoDesembolsado | undefined) ?? null);
        this.tabla1.set(t1);
        this.tabla2.set(t2);
        this.tabla3.set(t3);
        this.tabla4.set(t4);
        this.cargando.set(false);

        if ([t1, t2, t3, t4].every((t) => t.body.length === 0)) {
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
