import { Component, inject } from '@angular/core';
import { TableModule } from 'primeng/table';
import { DecimalPipe } from '@angular/common';
import { IncentivosService } from '../../services/incentivos.service';
import { ICONOS_INCENTIVOS } from '../../utils/incentivos-config.util';
import type { FilaTablaEfectividad, FilaTablaVariable } from '../../models';

/** `cod_var` 1..6 → id de variable — mismo mapeo que `iconFn`/`midx` del legado (`tabla.util.ts`/`avances.component.ts`). */
const ID_POR_COD_VAR = ['car', 'cli', 'sc1', 'efec1', 'efec2', 'efec3'];

/**
 * Tablas "Variables"/"Efectividad" del Cuadro de Mando — migrado de
 * `TablaComponent` (legado STG, `pages/modules/incentivos3/tabla`).
 * Reemplaza `stg-table2` (con `chipFn1`/`chipFn2` calculando estilos por
 * celda) por `p-table` con clases Tailwind condicionales — mismo criterio
 * de color (meta cumplida en verde, celda de monetización resaltada).
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

  protected iconoVariable(codVar: number): string {
    const id = ID_POR_COD_VAR[codVar - 1];
    return id ? ICONOS_INCENTIVOS[id] : 'pi pi-circle';
  }

  protected claseMeta(fila: FilaTablaVariable | FilaTablaEfectividad): string {
    return (fila.avan_fix ?? 0) >= 1 ? 'bg-[var(--mis-success-light)] text-[var(--mis-success)]' : 'bg-[var(--mis-danger-light)] text-[var(--mis-danger)]';
  }
}
