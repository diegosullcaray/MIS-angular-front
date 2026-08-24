import { Component, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { TabsModule } from 'primeng/tabs';
import { HierSelectorComponent } from '../../../../../../ui/hier-selector/hier-selector.component';
import { TablaReporteComponent } from '../../../../../../ui/tabla-reporte/tabla-reporte.component';
import { SelectFiltroComponent } from '../../../../../../ui/select-filtro/select-filtro.component';
import { EmptyStateComponent } from '../../../../../../../../../shared/ui/empty-state/empty-state.component';
import { WindowPanelComponent } from '../../../../../../../../../shared/ui/window-panel/window-panel.component';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { MOSTRAR_POR_POR_DEFECTO, OPCIONES_MOSTRAR_POR } from '../../models/portafolio-reasignado.model';
import { DetalleReasignadoComponent } from '../../ui/detalle-reasignado/detalle-reasignado.component';
import { ReporteReasignadoTabsBase } from '../../ui/reporte-reasignado.base';

/** "Gestión de Cartera Reasignada" (`leg/com/rda/adm/gest_cart_her`) — legado `RS_AGE_COM_CR` sobre el host `cra-v11`. */
@Component({
  selector: 'app-gestion-cartera-reasignada',
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
  templateUrl: './gestion-cartera-reasignada.component.html',
  styleUrl: './gestion-cartera-reasignada.component.css',
})
export class GestionCarteraReasignadaComponent extends ReporteReasignadoTabsBase {
  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  /** `Mostrar_por()` es filtro del reporte: afecta al resumen y al detalle por igual. */
  protected readonly opcionesMostrarPor = OPCIONES_MOSTRAR_POR;
  protected readonly mostrarPor = signal<number>(MOSTRAR_POR_POR_DEFECTO);

  protected consultarResumen(nodo: NodoConsulta): Observable<TablaReporteResultado> {
    return this.servicio.gestionResumen(nodo, this.mostrarPor());
  }

  protected consultarDetalle(nodo: NodoConsulta, extra: Record<string, unknown>): Observable<TablaReporteResultado> {
    return this.servicio.gestionDetalle(nodo, this.mostrarPor(), extra);
  }
}
