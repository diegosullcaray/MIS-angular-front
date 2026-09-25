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
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { DetalleReasignadoComponent } from '../../../../../actividad-diaria/components/Portafolio Reasignado/ui/detalle-reasignado/detalle-reasignado.component';
import { MonitorEfectividadesMensualBase } from '../../ui/monitor-efectividades-mensual.base';

/**
 * "Monitor Efectividades Reasignados" (`leg/com/rma/adm/mon-efec-reasig`) — legado
 * `RS_MON_EFECREASIGM` sobre el host `cra-v12`: pestaña de resumen (`_01`) y pestaña
 * "Detalle de Efectividades" (`_02`, paginado, con sus seis filtros más Última Gestión, Fecha
 * Compromiso y Asesor).
 */
@Component({
  selector: 'app-mensual-monitor-efectividades-reasignados',
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
  templateUrl: './monitor-efectividades-reasignados.component.html',
  styleUrl: './monitor-efectividades-reasignados.component.css',
})
export class MonitorEfectividadesReasignadosComponent extends MonitorEfectividadesMensualBase {
  protected readonly resumen = signal<TablaReporteResultado>(TABLA_VACIA);

  protected override cargarResumen(nodo: NodoConsulta, fecha: string): Subscription {
    this.cargandoResumen.set(true);
    return this.servicio.monitorEfectividadesReasignados(nodo, fecha).subscribe({
      next: (tabla) => {
        this.resumen.set(tabla);
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
    return this.servicio.detalleEfectividades('reasignados', nodo, fecha, filtros, pagina);
  }
}
