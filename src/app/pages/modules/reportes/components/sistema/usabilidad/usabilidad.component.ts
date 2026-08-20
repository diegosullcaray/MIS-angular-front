import { Component } from '@angular/core';
import { HeatmapComponent } from '../../../ui/heatmap/heatmap.component';
import { HEATMAP_REPORTES_DIARIOS, HEATMAP_REPORTES_MENSUALES } from '../../../models/sistema/sistema.model';

/** "Usabilidad" — migrado de la ruta `leg/sis` (legado STG, `reportes/legacy/usabilidad/dashboard`). */
import { WindowPanelComponent } from '../../../../../../shared/ui/window-panel/window-panel.component';
@Component({
  selector: 'app-usabilidad',
  standalone: true,
  imports: [HeatmapComponent, WindowPanelComponent],
  templateUrl: './usabilidad.component.html',
  styleUrl: './usabilidad.component.css',
})
export class UsabilidadComponent {
  protected readonly reportesDiarios = HEATMAP_REPORTES_DIARIOS;
  protected readonly reportesMensuales = HEATMAP_REPORTES_MENSUALES;
}
