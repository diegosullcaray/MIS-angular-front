import { Component, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { TabsModule } from 'primeng/tabs';
import { HierSelectorComponent } from '../../../../../../ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import {
  OPCIONES_PRODUCTO_REASIGNADO,
  OPCIONES_SI_NO,
  OPCIONES_TRAMO,
  OPCIONES_TRAMO_DIAS_GESTION,
  TODO,
} from '../../models/portafolio-reasignado.model';
import { DetalleReasignadoComponent } from '../../ui/detalle-reasignado/detalle-reasignado.component';
import { ReporteReasignadoTabsBase } from '../../ui/reporte-reasignado.base';

/** "Monitor Efectividades Reasignados" (`leg/com/rda/adm/mon-efec-reasig`) — legado `RS_MON_EFECREASIG` sobre el host `cra-v12`. */
@Component({
  selector: 'app-monitor-efectividades-reasignados',
  standalone: true,
  imports: [
    TabsModule,
    HierSelectorComponent,
    TablaReporteComponent,
    SelectFiltroComponent,
    EmptyStateComponent,
    WindowPanelComponent,
    DetalleReasignadoComponent,
  ],
  templateUrl: './monitor-efectividades-reasignados.component.html',
  styleUrl: './monitor-efectividades-reasignados.component.css',
})
export class MonitorEfectividadesReasignadosComponent extends ReporteReasignadoTabsBase {
  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly opcionesTramo = OPCIONES_TRAMO;
  protected readonly opcionesProducto = OPCIONES_PRODUCTO_REASIGNADO;
  protected readonly opcionesSiNo = OPCIONES_SI_NO;
  protected readonly opcionesTramoDias = OPCIONES_TRAMO_DIAS_GESTION;

  /** Los seis filtros que el legado declara en el bloque `_02`: solo afectan al detalle. */
  protected readonly tramo = signal(TODO);
  protected readonly producto = signal(TODO);
  protected readonly compromisoRoto = signal(TODO);
  protected readonly ceroCuota = signal(TODO);
  protected readonly unaCuota = signal(TODO);
  protected readonly tramoDiasGestion = signal(TODO);

  protected consultarResumen(nodo: NodoConsulta): Observable<TablaReporteResultado> {
    return this.servicio.monitorResumen(nodo);
  }

  protected consultarDetalle(nodo: NodoConsulta, extra: Record<string, unknown>): Observable<TablaReporteResultado> {
    return this.servicio.monitorDetalle(nodo, {
      ...extra,
      tramof: this.tramo(),
      prod: this.producto(),
      comp_r: this.compromisoRoto(),
      zcuo: this.ceroCuota(),
      ucuo: this.unaCuota(),
      tdcr: this.tramoDiasGestion(),
    });
  }
}
