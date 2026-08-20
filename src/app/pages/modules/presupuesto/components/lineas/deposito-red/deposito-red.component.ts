import { Component, inject } from '@angular/core';
import { LineaSimpleComponent } from '../linea-simple/linea-simple.component';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { calcularFilaDeposito } from '../../../utils/deposito-calculo.util';
import { COLUMNAS_DEPOSITO, type FilaDeposito } from '../../../models/deposito.model';
import type { LineaSimpleConfig } from '../../../models/linea-simple.model';

/** Depósitos Red (`/app/presupuesto/lineas/pasivos-patrimonio/car-dep-red`) — migrado de `PrePasPatCarteraDepositosRedComponent` (legado STG). */
@Component({
  selector: 'app-deposito-red',
  standalone: true,
  imports: [LineaSimpleComponent],
  template: `<app-linea-simple [config]="config" />`,
})
export class DepositoRedComponent {
  private readonly presupuesto = inject(PresupuestoService);

  protected readonly config: LineaSimpleConfig<FilaDeposito> = {
    mainTitle: 'Depósitos Red',
    columnas: COLUMNAS_DEPOSITO,
    paramsHier: { code: 2, maxLvl: 4, dlgTitulo: 'JERARQUIA AGENCIA DEP.' },
    inputCols: ['a2', 'b2', 'c2'],
    obtenerResumen: (tipCod, codRel) => this.presupuesto.obtenerResumenDepRed(tipCod, codRel),
    guardarResumen: (tipCod, codRel, filas) => this.presupuesto.guardarResumenDepRed(tipCod, codRel, filas),
    calcularFila: calcularFilaDeposito,
  };
}
