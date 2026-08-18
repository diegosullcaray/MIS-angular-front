import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SkeletonModule } from 'primeng/skeleton';
import { TablaReporteComponent } from '../../../../ui/tabla-reporte/tabla-reporte.component';
import { MonitorEfectividadesService } from '../../services/monitor-efectividades.service';
import { ToastService } from '../../../../../../../shared/services/toast.service';
import { MessageService } from '../../../../../../../core/services/message.service';
import {
  FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO,
  OPCIONES_PRODUCTO,
  OPCIONES_SI_NO,
  OPCIONES_TRAMO,
  OPCIONES_TRAMO_DIAS_GESTION,
} from '../../models/monitor-efectividades.model';
import { TooltipModule } from 'primeng/tooltip';
import { WindowPanelComponent } from '../../../../../../../shared/ui/window-panel/window-panel.component';
import type { AsesorSec } from '../../models/asesor-sec.model';
import type { TablaReporteResultado } from '../../../../models/tabla-reporte.model';
import type { FiltrosMonitorEfectividades } from '../../models/monitor-efectividades.model';

const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };

/**
 * "Detalle Monitor de Efectividades Asesor" — migrado de la ruta
 * `leg/com/rda/sec/mon_efec_sec` (legado STG,
 * `reportes/legacy/support/components/template/crs/report-crs-v3`, config
 * `RS_MON_EFEC_SEC` en `crs-map.ts`).
 *
 * Solo lectura: asesor + 6 filtros reales (Tramo, Producto, Compromiso Roto,
 * 0 Cuota, 1 Cuota, Tramo Días Gestión, todos `TODO` por defecto) → 1 tabla,
 * "Expresado en PEN y %". Cambiar cualquier filtro recarga la tabla si ya
 * hay un asesor elegido.
 */
@Component({
  selector: 'app-monitor-efectividades',
  standalone: true,
  imports: [FormsModule, SelectModule, SkeletonModule, TablaReporteComponent, TooltipModule, WindowPanelComponent],
  templateUrl: './monitor-efectividades.component.html',
  styleUrl: './monitor-efectividades.component.css',
})
export class MonitorEfectividadesComponent {
  private readonly servicio = inject(MonitorEfectividadesService);
  private readonly toast = inject(ToastService);
  private readonly mensajes = inject(MessageService);

  protected readonly opcionesTramo = OPCIONES_TRAMO;
  protected readonly opcionesProducto = OPCIONES_PRODUCTO;
  protected readonly opcionesSiNo = OPCIONES_SI_NO;
  protected readonly opcionesTramoDiasGestion = OPCIONES_TRAMO_DIAS_GESTION;

  protected readonly mostrarFiltros = signal(false);

  protected readonly asesores = signal<AsesorSec[]>([]);
  protected readonly asesorSeleccionado = signal<AsesorSec | null>(null);
  protected readonly filtros = signal<FiltrosMonitorEfectividades>({ ...FILTROS_MONITOR_EFECTIVIDADES_POR_DEFECTO });

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
    if (asesor) this.cargarMonitorEfectividades();
  }

  protected actualizarFiltro<K extends keyof FiltrosMonitorEfectividades>(campo: K, valor: FiltrosMonitorEfectividades[K]): void {
    this.filtros.update((f) => ({ ...f, [campo]: valor }));
    if (this.asesorSeleccionado()) this.cargarMonitorEfectividades();
  }

  private cargarMonitorEfectividades(): void {
    const asesor = this.asesorSeleccionado();
    if (!asesor) return;

    this.cargando.set(true);
    this.servicio.obtenerMonitorEfectividades({ tip_cod: 2, cod_rel: asesor.dni }, this.filtros()).subscribe({
      next: ({ tabla1 }) => {
        this.tabla1.set(tabla1);
        this.cargando.set(false);

        if (tabla1.body.length === 0) {
          this.mensajes.warn('Este asesor no tiene efectividades para los filtros elegidos.', 'Sin resultados');
        }
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
