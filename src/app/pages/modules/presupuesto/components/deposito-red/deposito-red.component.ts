import { Component, inject } from '@angular/core';
import { LineaSimpleComponent } from '../linea-simple/linea-simple.component';
import { PresupuestoService } from '../../services/presupuesto.service';
import { calcularFilaDeposito } from '../../utils/deposito-calculo.util';
import type { ColumnaTabla, LineaSimpleConfig } from '../../models';

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
 * Depósitos Red (`/app/presupuesto/lineas/pasivos-patrimonio/car-dep-red`) —
 * migrado de `PrePasPatCarteraDepositosRedComponent` (legado STG). Mismas
 * columnas y fórmula que Depósitos BP; solo cambia la jerarquía y el
 * get/post del backend.
 */
@Component({
  selector: 'app-deposito-red',
  standalone: true,
  imports: [LineaSimpleComponent],
  template: `<app-linea-simple [config]="config" />`,
})
export class DepositoRedComponent {
  private readonly presupuesto = inject(PresupuestoService);

  protected readonly config: LineaSimpleConfig = {
    mainTitle: 'Depósitos Red',
    columnas: COLUMNAS,
    paramsHier: { code: 2, maxLvl: 4, dlgTitulo: 'JERARQUIA AGENCIA DEP.' },
    inputCols: ['a2', 'b2', 'c2'],
    obtenerResumen: (tipCod, codRel) => this.presupuesto.obtenerResumenDepRed(tipCod, codRel),
    guardarResumen: (tipCod, codRel, filas) => this.presupuesto.guardarResumenDepRed(tipCod, codRel, filas),
    calcularFila: calcularFilaDeposito,
  };
}
