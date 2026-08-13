import { Component, inject, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { DecimalPipe } from '@angular/common';
import { IncentivosService } from '../../services/incentivos.service';
import { DESCRIPCIONES, ICONOS_INCENTIVOS } from '../../utils/incentivos-config.util';
import type { FilaTablaEfectividad, FilaTablaVariable } from '../../models/incentivos-tablas.model';
import type { DetalleTablaVariableEvent } from '../../models/incentivos-eventos.model';

const ID_POR_COD_VAR = ['car', 'cli', 'sc1', 'efec1', 'efec2', 'efec3'];

/** Tablas de variables y efectividad del Cuadro de Mando. */
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

  protected iconoPorCodVar(codVar: number): string {
    const id = ID_POR_COD_VAR[codVar - 1] ?? 'car';
    return ICONOS_INCENTIVOS[id] ?? 'pi pi-chart-bar';
  }

  protected iconoVariable(codVar: number): string {
    return this.iconoPorCodVar(codVar);
  }

  protected descripcionPorCodVar(codVar: number): string {
    const id = ID_POR_COD_VAR[codVar - 1] ?? 'car';
    return DESCRIPCIONES[id] ?? `Variable ${codVar}`;
  }

  protected solicitarDetalle(codVar: number): void {
    const titulo = this.descripcionPorCodVar(codVar);
    const icono = this.iconoPorCodVar(codVar);
    this.abrirDetalle.emit({ codVar, titulo, icono });
  }

  protected onClicFila(codVar: number): void {
    this.solicitarDetalle(codVar);
  }

  protected claseCelda(fila: FilaTablaVariable | FilaTablaEfectividad, tipo: string): string {
    if (tipo === 'met' && fila.avan_fix !== undefined) {
      return fila.avan_fix >= 1 ? 'font-semibold text-[var(--mis-success)]' : '';
    }
    return '';
  }

  protected truncarAvanFix(val?: number): number {
    return Math.floor(val ?? 0);
  }
}
