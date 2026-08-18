import { Component, inject, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { IncentivosService } from '../../services/incentivos.service';
import { INDICE_SUPER_PLUS } from '../../utils/incentivos-config.util';
import type { ItemSuperPlus } from '../../models/incentivos-tablas.model';
import type { DetalleSuperPlusEvent } from '../../models/incentivos-eventos.model';

/** Grilla de ítems Super Plus del Cuadro de Mando. */
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

  protected solicitarDetalle(item: ItemSuperPlus): void {
    if (!item.enab) return;
    const codVar = INDICE_SUPER_PLUS[item.id] ?? 1;
    this.abrirDetalle.emit({ item, codVar });
  }

  protected onClic(item: ItemSuperPlus): void {
    this.solicitarDetalle(item);
  }

  /**
   * Fondo de la caja — `getBoxCls()` del legado (`bg3` inactivo, `bg2` en
   * negativo, `bg1` normal). Los tokens `--mis-*-text` que usaba esta función
   * antes no existen en `tokens.css`, así que las cajas se quedaban sin fondo
   * ni color de texto.
   */
  protected claseCaja(item: ItemSuperPlus): string {
    if (item.estado === 0) return 'bg-[var(--mis-panel-bg)] text-[var(--mis-text-tertiary)]';
    if (item.val < 0) return 'bg-[var(--mis-danger-light)] text-[var(--mis-danger)]';
    return 'bg-[var(--mis-secondary-light)] text-[var(--mis-text-primary)]';
  }
}
