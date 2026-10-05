import { Component, input } from '@angular/core';
import type { KpiTablero } from '../../models/actividad-comercial.model';
import { formatearValor } from '../../utils/actividad-comercial.util';

/** Fila de indicadores al pie de una tarjeta: etiqueta, valor y variación o apoyo. */
@Component({
  selector: 'app-kpi-pie',
  standalone: true,
  templateUrl: './kpi-pie.component.html',
  styleUrl: './kpi-pie.component.css',
})
export class KpiPieComponent {
  readonly kpis = input.required<readonly KpiTablero[]>();

  protected texto(kpi: KpiTablero): string {
    return formatearValor(kpi.valor, kpi.formato);
  }
}
