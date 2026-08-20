import { Component, inject } from '@angular/core';
import { LineaSimpleComponent } from '../linea-simple/linea-simple.component';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { calcularFilaDeposito } from '../../../utils/deposito-calculo.util';
import { COLUMNAS_DEPOSITO, type FilaDeposito } from '../../../models/deposito.model';
import type { LineaSimpleConfig } from '../../../models/linea-simple.model';

/** Depósitos Banca Preferente (`/app/presupuesto/lineas/pasivos-patrimonio/car-dep-bp`) — migrado de `PrePasPatCarteraDepositosBpComponent` (legado STG). */
@Component({
  selector: 'app-deposito-bp',
  standalone: true,
  imports: [LineaSimpleComponent],
  template: `<app-linea-simple [config]="config" />`,
})
export class DepositoBpComponent {
  private readonly presupuesto = inject(PresupuestoService);

  protected readonly config: LineaSimpleConfig<FilaDeposito> = {
    mainTitle: 'Depósitos Banca Preferente',
    columnas: COLUMNAS_DEPOSITO,
    paramsHier: { code: 7, maxLvl: 2, dlgTitulo: 'JERARQUIA BANCA PREF.' },
    inputCols: ['a2', 'b2', 'c2'],
    obtenerResumen: (tipCod, codRel) => this.presupuesto.obtenerResumenDepBP(tipCod, codRel),
    guardarResumen: (tipCod, codRel, filas) => this.presupuesto.guardarResumenDepBP(tipCod, codRel, filas),
    calcularFila: calcularFilaDeposito,
  };
}
