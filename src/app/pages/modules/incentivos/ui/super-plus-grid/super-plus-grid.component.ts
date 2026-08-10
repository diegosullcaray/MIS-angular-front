import { Component, inject, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IncentivosService } from '../../services/incentivos.service';
import { INDICE_SUPER_PLUS } from '../../utils/incentivos-config.util';
import type { ItemSuperPlus } from '../../models';

/** Payload emitido al hacer clic en un ítem habilitado — `codVar` es el índice (1-based) que espera el diálogo de detalle correspondiente. */
export interface DetalleSuperPlusEvent {
  item: ItemSuperPlus;
  codVar: number;
}

/** Migrado de `SuperPlusComponent` (legado STG, `pages/modules/incentivos3/super-plus`). */
@Component({
  selector: 'app-super-plus-grid',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './super-plus-grid.component.html',
  styleUrl: './super-plus-grid.component.css',
})
export class SuperPlusGridComponent {
  protected readonly incentivos = inject(IncentivosService);

  readonly abrirDetalle = output<DetalleSuperPlusEvent>();

  protected claseCaja(item: ItemSuperPlus): string {
    if (item.estado === 0) return 'bg-[var(--mis-primary-light)] text-[var(--mis-text-primary)]';
    return item.val >= 0
      ? 'bg-[var(--mis-success-light)] text-[var(--mis-success)]'
      : 'bg-[var(--mis-danger-light)] text-[var(--mis-danger)]';
  }

  protected onClic(item: ItemSuperPlus): void {
    if (item.enab) this.abrirDetalle.emit({ item, codVar: INDICE_SUPER_PLUS[item.id] ?? 0 });
  }
}
