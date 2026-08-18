import { Component } from '@angular/core';
import { HeatmapComponent } from '../../../ui/heatmap/heatmap.component';
import { HEATMAP_REPORTES_DIARIOS, HEATMAP_REPORTES_MENSUALES } from '../../../models/sistema/sistema.model';

/**
 * "Usabilidad" — migrado de la ruta `leg/sis` (legado STG,
 * `reportes/legacy/usabilidad/dashboard`).
 *
 * A diferencia del resto del módulo, este reporte no consulta ningún backend:
 * el legado ya mostraba dos heatmaps con datos de ejemplo fijos (semanas
 * 27–37 de una captura histórica), sin jerarquía ni filtros. Se preservan
 * tal cual como placeholder visual — ver `models/sistema/sistema.model.ts`.
 */
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
