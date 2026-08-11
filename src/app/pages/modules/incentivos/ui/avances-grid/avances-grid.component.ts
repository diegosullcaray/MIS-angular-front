import { Component, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KnobModule } from 'primeng/knob';
import { DecimalPipe } from '@angular/common';
import { IncentivosService } from '../../services/incentivos.service';
import type { ItemAvance } from '../../models';

/** Payload emitido al hacer clic en un ítem habilitado — `codVar` es el índice que espera `incentivos3.detalle_var3`. */
export interface DetalleAvanceEvent {
  item: ItemAvance;
  codVar: number;
}

/**
 * Grilla de Avances — migrado de `AvancesComponent` (legado STG,
 * `pages/modules/incentivos3/avances`). Reemplaza el "circle pie" CSS
 * casero (`circle-pie.scss`, un truco de 100 selectores con
 * `linear-gradient`) por `p-knob` de PrimeNG en modo solo lectura — mismo
 * efecto visual con muchísimo menos código.
 */
@Component({
  selector: 'app-avances-grid',
  standalone: true,
  imports: [KnobModule, FormsModule, DecimalPipe],
  templateUrl: './avances-grid.component.html',
  styleUrl: './avances-grid.component.css',
})
export class AvancesGridComponent {
  protected readonly incentivos = inject(IncentivosService);

  readonly abrirDetalle = output<DetalleAvanceEvent>();

  /** Índice de variable esperado por `incentivos3.detalle_var3` — `midx` de `AvancesComponent.showDetail()` del legado. */
  private readonly indiceDetalle: Record<string, number> = { car: 91, cli: 2, sc1: 3, efec1: 4, efec2: 5, efec3: 6 };

  /** `p-knob` asume `[0,100]` — pasarle `item.per` sin acotar cuando supera 100 (meta superada) rompe el arco. El valor real sigue mostrándose sin acotar en el texto (`item.val`). */
  protected arcoAvance(item: ItemAvance): number {
    return Math.min(Math.max(item.per, 0), 100);
  }

  protected colorAvance(item: ItemAvance): string {
    if (item.val >= 0.65 && item.val < 1) return '#efb45f';
    if (item.val > 0 && item.val < 0.65) return '#E3005B';
    return '#3fe91e';
  }

  protected colorEstado(item: ItemAvance): string {
    if (item.sit === 1) return 'text-[var(--mis-success)]';
    if (item.sit === 2) return 'text-[var(--mis-warning)]';
    return 'text-[var(--mis-text-tertiary)]';
  }

  protected onClic(item: ItemAvance): void {
    if (item.enab) this.abrirDetalle.emit({ item, codVar: this.indiceDetalle[item.id] ?? 0 });
  }
}
