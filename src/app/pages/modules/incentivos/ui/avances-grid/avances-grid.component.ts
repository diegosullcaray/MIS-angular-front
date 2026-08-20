import { Component, inject, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IncentivosService } from '../../services/incentivos.service';
import { COD_VAR_DETALLE } from '../../utils/incentivos-config.util';
import type { ItemAvance } from '../../models/incentivos-tablas.model';
import type { DetalleAvanceEvent } from '../../models/incentivos-eventos.model';

/** Grilla de Avances del Cuadro de Mando. */
@Component({
  selector: 'app-avances-grid',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './avances-grid.component.html',
  styleUrl: './avances-grid.component.css',
})
export class AvancesGridComponent {
  protected readonly incentivos = inject(IncentivosService);

  readonly abrirDetalle = output<DetalleAvanceEvent>();

  protected solicitarDetalle(item: ItemAvance): void {
    if (!item.enab) return;
    const codVar = COD_VAR_DETALLE[item.id] ?? 1;
    this.abrirDetalle.emit({ item, codVar });
  }

  protected onClic(item: ItemAvance): void {
    this.solicitarDetalle(item);
  }

  /** Color del arco según el avance — mismos cortes que `pieStyle()` del legado: ámbar entre 65% y 100%, rojo por debajo de 65% y verde al llegar a la meta (el 0 también cae en verde, igual que en el legado, porque ahí todavía no hay avance que calificar). */
  protected colorAvance(item: ItemAvance): string {
    if (item.val >= 0.65 && item.val < 1) return 'var(--mis-warning)';
    if (item.val > 0 && item.val < 0.65) return 'var(--mis-danger)';
    return 'var(--mis-success)';
  }

  /** Relleno del anillo (`per` = `${id}_avan_floor`), tope 100 para avances por encima de la meta. */
  protected porcentajeAnillo(item: ItemAvance): number {
    return Math.min(Math.max(item.per ?? 0, 0), 100);
  }

  protected fondoAnillo(item: ItemAvance): string {
    return `conic-gradient(${this.colorAvance(item)} ${this.porcentajeAnillo(item)}%, var(--mis-border-strong) 0)`;
  }
}
