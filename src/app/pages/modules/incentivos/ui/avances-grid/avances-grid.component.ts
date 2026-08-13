import { Component, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KnobModule } from 'primeng/knob';
import { DecimalPipe } from '@angular/common';
import { IncentivosService } from '../../services/incentivos.service';
import type { ItemAvance } from '../../models/incentivos-tablas.model';
import type { DetalleAvanceEvent } from '../../models/incentivos-eventos.model';

const COD_VAR_POR_ID: Record<string, number> = {
  car: 1,
  cli: 2,
  sc1: 3,
  efec1: 4,
  efec2: 5,
  efec3: 6,
};

/** Grilla de Avances del Cuadro de Mando. */
@Component({
  selector: 'app-avances-grid',
  standalone: true,
  imports: [FormsModule, KnobModule, DecimalPipe],
  templateUrl: './avances-grid.component.html',
  styleUrl: './avances-grid.component.css',
})
export class AvancesGridComponent {
  protected readonly incentivos = inject(IncentivosService);

  readonly abrirDetalle = output<DetalleAvanceEvent>();

  protected solicitarDetalle(item: ItemAvance): void {
    if (!item.enab) return;
    const codVar = COD_VAR_POR_ID[item.id] ?? 1;
    this.abrirDetalle.emit({ item, codVar });
  }

  protected onClic(item: ItemAvance): void {
    this.solicitarDetalle(item);
  }

  protected colorAvance(item: ItemAvance): string {
    if (item.sit === 1) return 'var(--mis-success)';
    return 'var(--mis-primary-text)';
  }

  protected colorEstado(item: ItemAvance): string {
    if (item.sit === 1) return 'text-[var(--mis-success)]';
    return 'text-[var(--mis-text-tertiary)]';
  }
}
