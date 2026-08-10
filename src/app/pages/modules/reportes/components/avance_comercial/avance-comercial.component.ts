import { Component, signal } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { MonitorMetasDesembolsoComponent } from './monitor-metas-desembolso/monitor-metas-desembolso.component';
import { MonitorReprogramadosComponent } from './monitor-reprogramados/monitor-reprogramados.component';

/**
 * "Avance Comercial" (`/app/reportes/avance-comercial`) — primer nodo
 * migrado del módulo `reportes` (legado STG, `pages/modules/reportes`).
 * Agrupa 2 reportes de `reportes/legacy/comercial/rda/administracion`
 * (`ReportCraV1p1Component` genérico del legado, ver
 * `MonitorMetasDesembolsoComponent`/`MonitorReprogramadosComponent` para el
 * detalle de la migración): "Monitor Metas Desembolso" (`mon-desem`) y
 * "Monitor Reprogramados" (`mon-rep`).
 *
 * El resto del árbol de `reportes` (actividad diaria, control de cargas,
 * desarrollo sostenible, etc. — ver el andamiaje de carpetas ya creado bajo
 * `pages/modules/reportes/components`) queda fuera de este primer recorte;
 * se migra nodo por nodo.
 */
@Component({
  selector: 'app-avance-comercial',
  standalone: true,
  imports: [TabsModule, MonitorMetasDesembolsoComponent, MonitorReprogramadosComponent],
  templateUrl: './avance-comercial.component.html',
  styleUrl: './avance-comercial.component.css',
})
export class AvanceComercialComponent {
  protected readonly tabActiva = signal('mon-desem');
}
