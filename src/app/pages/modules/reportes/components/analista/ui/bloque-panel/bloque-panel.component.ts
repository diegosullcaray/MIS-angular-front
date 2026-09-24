import { Component, input } from '@angular/core';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import type { TablaReporteResultado } from '../../../../models/tabla-reporte.model';

/** Un bloque del motor de reportes con su título y nota del legado. */
@Component({
  selector: 'app-bloque-panel',
  standalone: true,
  imports: [TablaReporteComponent],
  templateUrl: './bloque-panel.component.html',
  styleUrl: './bloque-panel.component.css',
})
export class BloquePanelComponent {
  readonly tabla = input.required<TablaReporteResultado>();
  readonly titulo = input('');
  readonly nota = input<readonly string[]>([]);
}
