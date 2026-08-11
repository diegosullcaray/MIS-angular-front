import { Component, inject, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { DecimalPipe } from '@angular/common';
import { IncentivosService } from '../../services/incentivos.service';
import { DESCRIPCIONES, ICONOS_INCENTIVOS } from '../../utils/incentivos-config.util';
import type { FilaTablaEfectividad, FilaTablaVariable } from '../../models';

/** `cod_var` 1..6 → id de variable — mismo mapeo que `iconFn`/`midx` del legado (`tabla.util.ts`/`avances.component.ts`). */
const ID_POR_COD_VAR = ['car', 'cli', 'sc1', 'efec1', 'efec2', 'efec3'];

/** Payload emitido al hacer clic en una fila — el detalle solo se muestra en el diálogo (`DetalleVariableDialogComponent`), nunca embebido en la tabla. */
export interface DetalleTablaVariableEvent {
  codVar: number;
  titulo: string;
  icono: string;
}

/**
 * Tablas "Variables"/"Efectividad" del Cuadro de Mando — migrado de
 * `TablaComponent` (legado STG, `pages/modules/incentivos3/tabla`).
 * Reemplaza `stg-table2` (con `chipFn1`/`chipFn2` calculando estilos por
 * celda) por `p-table` con clases Tailwind condicionales — mismo criterio
 * de color (meta cumplida en verde, celda de monetización resaltada).
 *
 * Clic en una fila emite `abrirDetalle` para que el contenedor abra el
 * diálogo de detalle (`DetalleVariableDialogComponent`) — igual que
 * `AvancesGridComponent`/`SuperPlusGridComponent`. El detalle nunca se
 * muestra embebido en esta tabla.
 */
@Component({
  selector: 'app-tabla-variables',
  standalone: true,
  imports: [TableModule, DecimalPipe],
  templateUrl: './tabla-variables.component.html',
  styleUrl: './tabla-variables.component.css',
})
export class TablaVariablesComponent {
  protected readonly incentivos = inject(IncentivosService);

  readonly abrirDetalle = output<DetalleTablaVariableEvent>();

  protected iconoVariable(codVar: number): string {
    const id = ID_POR_COD_VAR[codVar - 1];
    return id ? ICONOS_INCENTIVOS[id] : 'pi pi-circle';
  }

  protected onClicFila(codVar: number): void {
    const id = ID_POR_COD_VAR[codVar - 1];
    this.abrirDetalle.emit({
      codVar,
      titulo: id ? DESCRIPCIONES[id] : '',
      icono: id ? ICONOS_INCENTIVOS[id] : 'pi pi-circle',
    });
  }

  /**
   * Chip de color por celda — mismo criterio que `chipFn1`/`chipFn2` (legado STG,
   * `tabla.util.ts`) pero con la paleta de tokens `--mis-*` del sistema en vez de los hex
   * hardcodeados del legado: `ini` = neutro (valor de referencia), `real` = celeste secundario
   * (valor destacado: `cie_n`/`var_real` en Variables, todo salvo `ini`/`mon` en Efectividad),
   * `mon` = primario con texto claro, `met` = éxito/peligro según si `avan_fix` alcanzó la meta.
   */
  protected claseCelda(fila: FilaTablaVariable | FilaTablaEfectividad, columna: 'ini' | 'real' | 'met' | 'mon'): string {
    const base = 'text-right rounded px-1.5 border border-[var(--mis-border)]';
    if (columna === 'mon') return `${base} bg-[var(--mis-primary)] text-[var(--mis-text-on-primary)] font-semibold`;
    if (columna === 'met') {
      return (fila.avan_fix ?? 0) >= 1
        ? `${base} bg-[var(--mis-success-light)] text-[var(--mis-success)]`
        : `${base} bg-[var(--mis-danger-light)] text-[var(--mis-danger)]`;
    }
    if (columna === 'real') return `${base} bg-[var(--mis-secondary-light)] text-[var(--mis-text-primary)]`;
    return `${base} bg-[var(--mis-bg)] text-[var(--mis-text-secondary)]`;
  }
}
