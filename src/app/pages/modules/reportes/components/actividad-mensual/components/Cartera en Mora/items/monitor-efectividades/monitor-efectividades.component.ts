import { Component, signal } from '@angular/core';
import type { Observable, Subscription } from 'rxjs';
import { TabsModule } from 'primeng/tabs';
import { HierSelectorComponent } from '../../../../../../../../../shared/ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { GrupoFiltrosComponent } from '../../../../../../../../../shared/ui/formularios/grupo-filtros/grupo-filtros.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import { TABLA_PENDIENTE, type TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { TODO } from '../../../../../actividad-diaria/components/Portafolio Reasignado/models/portafolio-reasignado.model';
import { OPCIONES_PRECOSECHA } from '../../../../../actividad-diaria/components/Cartera en Mora/models/cartera-en-mora.model';
import { DetalleReasignadoComponent } from '../../../../../actividad-diaria/components/Portafolio Reasignado/ui/detalle-reasignado/detalle-reasignado.component';
import { MonitorEfectividadesMensualBase } from '../../ui/monitor-efectividades-mensual.base';

/**
 * "Monitor Efectividades" (`leg/com/rma/adm/mon-efec`) — legado `RS_MON_EFECM` sobre el host
 * `cra-v4`: pestaña de resumen (`_01` y `_03` por tramo) y pestaña "Detalle de Efectividades"
 * (`_02`, paginado, con sus siete filtros más Última Gestión, Fecha Compromiso y Asesor).
 */
@Component({
  selector: 'app-mensual-monitor-efectividades',
  standalone: true,
  imports: [
    TabsModule,
    HierSelectorComponent,
    TablaReporteComponent,
    SelectFiltroComponent,
    GrupoFiltrosComponent,
    EmptyStateComponent,
    WindowPanelComponent,
    DetalleReasignadoComponent,
  ],
  templateUrl: './monitor-efectividades.component.html',
  styleUrl: './monitor-efectividades.component.css',
})
export class MonitorEfectividadesComponent extends MonitorEfectividadesMensualBase {
  protected readonly opcionesPrecosecha = OPCIONES_PRECOSECHA;
  protected readonly precosecha = signal(TODO);

  protected readonly tablasResumen = signal<TablaReporteResultado[]>([]);

  /** Bloques del resumen, en el orden de `BLOQUES_MONITOR_EFECTIVIDADES`. */
  protected readonly bloquesResumen = [
    { titulo: 'Monitor de Efectividades', nota: undefined as string | undefined },
    {
      titulo: 'Resumen de Gestiones Ingresadas en Tramo -30-0: Operaciones Deterioradas',
      nota:
        '<b>a:</b> Número de clientes de riesgo alto y medio alto en el tramo de -30-0.<br>' +
        '<b>b:</b> Número de Gestiones realizadas entre Número de Clientes Gestionados.',
    },
    {
      titulo: 'Resumen de Gestiones Ingresadas en Tramo 1-30',
      nota:
        '<b>a:</b> Número de clientes de riesgo alto y medio alto en el tramo de 1-30.<br>' +
        '<b>b:</b> Número de Gestiones realizadas entre Número de Clientes Gestionados.',
    },
  ];

  /** Un bloque sigue cargando mientras no llegó su respuesta (carga independiente). */
  protected bloquePendiente(i: number): boolean {
    const tabla = this.tablasResumen()[i];
    return this.cargandoResumen() || !tabla || tabla === TABLA_PENDIENTE;
  }

  protected override filtrosPropios(): Record<string, unknown> {
    return { precosechaf: this.precosecha() };
  }

  protected override cargarResumen(nodo: NodoConsulta, fecha: string): Subscription {
    this.cargandoResumen.set(true);
    this.tablasResumen.set([]);
    return this.servicio.monitorEfectividades(nodo, fecha).subscribe({
      next: (tablas) => {
        this.tablasResumen.set(tablas);
        this.cargandoResumen.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargandoResumen.set(false);
      },
    });
  }

  protected override consultarDetalle(
    nodo: NodoConsulta,
    fecha: string,
    filtros: Record<string, unknown>,
    pagina: number,
  ): Observable<TablaReporteResultado> {
    return this.servicio.detalleEfectividades('monitor', nodo, fecha, filtros, pagina);
  }
}
