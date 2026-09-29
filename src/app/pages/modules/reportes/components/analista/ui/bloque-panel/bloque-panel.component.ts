import { Component, input } from '@angular/core';
import { TablaReporteComponent } from '../../../../../../../shared/ui/tablas/tabla-reporte/tabla-reporte.component';
import type { TablaReporteResultado } from '../../../../models/tabla-reporte.model';
import { ChipInformativoComponent } from '../../../../../../../shared/ui/chip-informativo/chip-informativo.component';

/** Tabla de un reporte con su título y unidad en chips. */
@Component({
  selector: 'app-bloque-panel',
  standalone: true,
  imports: [TablaReporteComponent, ChipInformativoComponent],
  templateUrl: './bloque-panel.component.html',
  styleUrl: './bloque-panel.component.css',
})
export class BloquePanelComponent {
  readonly tabla = input.required<TablaReporteResultado>();
  readonly titulo = input('');
  readonly chip = input('');
  readonly cargando = input(false);
  readonly ajustarAncho = input(false);
}
