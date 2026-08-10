import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { SkeletonModule } from 'primeng/skeleton';
import { HierSelectorComponent } from '../../../ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../ui/tabla-reporte/tabla-reporte.component';
import { ReportesService, COD_JERARQUIA_ORGANIZATIVA, NIVEL_MAXIMO_JERARQUIA } from '../../../services/reportes.service';
import { ToastService } from '../../../../../../shared/services/toast.service';
import type {
  HierarquiaNodo,
  KpiMontoDesembolsado,
  KpiOperacionesDesembolsadas,
  ParamsJerarquia,
  TablaReporteResultado,
} from '../../../models';

const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };

/**
 * "Monitor Metas Desembolso" — migrado de la ruta `mon-desem` (legado STG,
 * `reportes/legacy/comercial/rda/administracion`, `cod_rep: 'Monitor_Dese'`),
 * renderizada en el legado por el motor genérico `ReportCraV1p1Component`.
 * Ese reporte tiene 4 bloques (`Monitor_Dese_01`..`_04`): los dos primeros
 * son tarjetas KPI ("Operaciones Desembolsadas"/"Monto Desembolsado" con su
 * cumplimiento de meta), los dos últimos son tablas de datos genéricas.
 *
 * No migra el bloque hermano `Monitor_Dese_misi` (ruta `mon-desem-misi`,
 * "Monitor Metas Desembolso Misionales") — fuera del alcance de este nodo
 * (`avance_comercial`), es una variante con su propio filtro de producto.
 */
@Component({
  selector: 'app-monitor-metas-desembolso',
  standalone: true,
  imports: [HierSelectorComponent, TablaReporteComponent, SkeletonModule],
  templateUrl: './monitor-metas-desembolso.component.html',
  styleUrl: './monitor-metas-desembolso.component.css',
})
export class MonitorMetasDesembolsoComponent {
  private readonly reportes = inject(ReportesService);
  private readonly toast = inject(ToastService);

  protected readonly paramsHier: ParamsJerarquia = {
    code: COD_JERARQUIA_ORGANIZATIVA,
    maxLvl: NIVEL_MAXIMO_JERARQUIA,
    dlgTitulo: 'JERARQUIA UNIDAD',
  };

  protected readonly nivelActual = signal<HierarquiaNodo | null>(null);
  protected readonly cargando = signal(false);

  protected readonly kpiOperaciones = signal<KpiOperacionesDesembolsadas | null>(null);
  protected readonly kpiMonto = signal<KpiMontoDesembolsado | null>(null);
  protected readonly tablaOperaciones = signal<TablaReporteResultado>(TABLA_VACIA);
  protected readonly tablaMontos = signal<TablaReporteResultado>(TABLA_VACIA);

  protected onNivelSeleccionado(nodo: HierarquiaNodo): void {
    this.nivelActual.set(nodo);
    this.cargando.set(true);

    const nivel = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel };

    forkJoin({
      operaciones: this.reportes.obtenerBloqueReporte('Monitor_Dese_01', { ...nivel, tipmet: 1 }),
      monto: this.reportes.obtenerBloqueReporte('Monitor_Dese_02', { ...nivel, tipmet: 1 }),
      tablaOperaciones: this.reportes.obtenerBloqueReporte('Monitor_Dese_03', { ...nivel, tipmet: 1 }),
      tablaMontos: this.reportes.obtenerBloqueReporte('Monitor_Dese_04', nivel),
    }).subscribe({
      next: ({ operaciones, monto, tablaOperaciones, tablaMontos }) => {
        this.kpiOperaciones.set((operaciones.additional as unknown as KpiOperacionesDesembolsadas | undefined) ?? null);
        this.kpiMonto.set((monto.additional as unknown as KpiMontoDesembolsado | undefined) ?? null);
        this.tablaOperaciones.set(tablaOperaciones);
        this.tablaMontos.set(tablaMontos);
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }
}
