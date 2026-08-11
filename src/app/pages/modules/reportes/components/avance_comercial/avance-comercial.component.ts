import { Component, inject, input, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
 * "Monitor Reprogramados" (`mon-rep`). Soporta las rutas del menú STG
 * (`/app/reportes/leg/com/rda/adm/mon-desem` y `/app/reportes/leg/com/rda/adm/mon-rep`).
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
  private readonly route = inject(ActivatedRoute, { optional: true });

  /** `tab` opcional si viene por parámetro de ruta (ej. `:tab` en `leg/com/rda/adm/:tab`). */
  readonly tab = input<string>();

  protected readonly tabActiva = signal('mon-desem');

  constructor() {
    const urlCompleta = this.route?.snapshot.pathFromRoot.flatMap((r) => r.url.map((u) => u.path)).join('/') ?? '';
    if (urlCompleta.includes('mon-rep') || this.tab() === 'mon-rep') {
      this.tabActiva.set('mon-rep');
    }
  }
}
