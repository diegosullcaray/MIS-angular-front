import { Component, inject, output } from '@angular/core';
import { TableModule } from 'primeng/table';
import { DecimalPipe } from '@angular/common';
import { IncentivosService } from '../../services/incentivos.service';
import { COD_VAR_DETALLE, DESCRIPCIONES, ICONOS_INCENTIVOS, ID_POR_COD_VAR } from '../../utils/incentivos-config.util';
import type { FilaTablaEfectividad, FilaTablaVariable } from '../../models/incentivos-tablas.model';
import type { DetalleTablaVariableEvent } from '../../models/incentivos-eventos.model';

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
    const id = ID_POR_COD_VAR[codVar - 1];
    if (!id) return 'pi pi-circle';
    return ICONOS_INCENTIVOS[id] ?? 'pi pi-circle';
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
    // El `cod_var` de la tabla no es el que espera el detalle (Cartera viaja
    // como 1 acá y como 91 en `detalle_var3`) — ver `COD_VAR_DETALLE`.
    const id = ID_POR_COD_VAR[codVar - 1];
    this.abrirDetalle.emit({ codVar: COD_VAR_DETALLE[id] ?? codVar, titulo, icono });
  }

  protected onClicFila(codVar: number): void {
    this.solicitarDetalle(codVar);
  }

  /** Chip de cada celda numérica — `chipFn1`/`chipFn2` de `tabla.util.ts` (legado): la meta va en verde o rojo según `avan_fix`, la monetización en navy, los valores "reales" en celeste y el resto en gris. */
  protected claseCelda(fila: FilaTablaVariable | FilaTablaEfectividad, tipo: string): string {
    if (tipo === 'met') {
      const avance = fila.avan_fix;
      return avance !== undefined && avance >= 1 ? 'chip chip--meta-ok' : 'chip chip--meta-baja';
    }
    if (tipo === 'mon') return 'chip chip--mon';
    if (tipo === 'real') return 'chip chip--real';
    return 'chip chip--neutro';
  }

  protected truncarAvanFix(val?: number): number {
    return Math.floor(val ?? 0);
  }
}
