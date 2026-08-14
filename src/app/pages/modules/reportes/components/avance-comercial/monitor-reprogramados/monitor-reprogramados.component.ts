import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { ButtonModule } from 'primeng/button';
import { HierSelectorComponent } from '../../../ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../ui/tabla-reporte/tabla-reporte.component';
import { PARAMS_HIER_UNIDAD } from '../../../models/jerarquia.model';
import { AvanceComercialService } from '../../../services/avance-comercial.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../core/services/message.service';
import { crearManejadorErrorJerarquia } from '../../../utils/hier-selector-error.util';
import { OPCIONES_TIPO_MON_REP } from '../../../models/avance-comercial/avance-comercial.model';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';

const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };

/**
 * "Monitor Reprogramados" — migrado de la ruta `mon-rep` (legado STG,
 * `reportes/legacy/comercial/rda/administracion`, `cod_rep: 'RS_MON_REP'`).
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
  selector: 'app-monitor-reprogramados',
  standalone: true,
  imports: [HierSelectorComponent, TablaReporteComponent, EmptyStateComponent, SelectModule, FormsModule, SkeletonModule, ProgressSpinnerModule, ButtonModule],
  templateUrl: './monitor-reprogramados.component.html',
  styleUrl: './monitor-reprogramados.component.css',
})
export class MonitorReprogramadosComponent {
  private readonly servicio = inject(AvanceComercialService);
  private readonly toast = inject(ToastService);
  private readonly mensajes = inject(MessageService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesTipo = OPCIONES_TIPO_MON_REP;

  protected readonly mostrarFiltros = signal(true);
  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
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
