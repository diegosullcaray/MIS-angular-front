import { Component, inject } from '@angular/core';
import { LineaSimpleComponent } from '../linea-simple/linea-simple.component';
import { PresupuestoService } from '../../../services/presupuesto.service';
import { calcularFilaDeposito } from '../../../utils/deposito-calculo.util';
import type { ColumnaTabla, FilaDeposito, LineaSimpleConfig } from '../../../models';

const COLUMNAS: ColumnaTabla[] = [
  { label: 'Fecha', key: 'fec_pro', tipo: 'text' },
  {
    label: 'Ahorros',
    hijos: [
      { label: 'Saldo Inicial', key: 'a1', tipo: 'number' },
      { label: 'Variación', key: 'a2', tipo: 'comp_f' },
      { label: 'Saldo Final', key: 'a3', tipo: 'number' },
    ],
  },
  {
    label: 'CTS',
    hijos: [
      { label: 'Saldo Inicial', key: 'b1', tipo: 'number' },
      { label: 'Variación', key: 'b2', tipo: 'comp_f' },
      { label: 'Saldo Final', key: 'b3', tipo: 'number' },
    ],
  },
  {
    label: 'Plazo Fijo',
    hijos: [
      { label: 'Saldo Inicial', key: 'c1', tipo: 'number' },
      { label: 'Variación', key: 'c2', tipo: 'comp_f' },
      { label: 'Saldo Final', key: 'c3', tipo: 'number' },
    ],
  },
];

/**
 * Depósitos Banca Preferente (`/app/presupuesto/lineas/pasivos-patrimonio/car-dep-bp`)
 * — migrado de `PrePasPatCarteraDepositosBpComponent` (legado STG).
 */
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
    columnas: COLUMNAS,
    paramsHier: { code: 7, maxLvl: 2, dlgTitulo: 'JERARQUIA BANCA PREF.' },
    inputCols: ['a2', 'b2', 'c2'],
    obtenerResumen: (tipCod, codRel) => this.presupuesto.obtenerResumenDepBP(tipCod, codRel),
    guardarResumen: (tipCod, codRel, filas) => this.presupuesto.guardarResumenDepBP(tipCod, codRel, filas),
    calcularFila: calcularFilaDeposito,
  };
}
