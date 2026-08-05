import { Component, inject } from '@angular/core';
import { LineaSimpleComponent } from '../linea-simple/linea-simple.component';
import { PresupuestoService } from '../../../services/presupuesto.service';
import type { ColumnaTabla, FilaSegurosOperaciones, LineaSimpleConfig } from '../../../models';

const COLUMNAS: ColumnaTabla[] = [
  { label: 'Fecha', key: 'fec_pro', tipo: 'text' },
  { label: 'Multiahorro', key: 'seg_ope_mul_ah', tipo: 'comp_f' },
  { label: 'Protección Tarjetas', key: 'seg_ope_pro_tar', tipo: 'comp_f' },
  { label: 'SOAT', key: 'seg_ope_soat', tipo: 'comp_f' },
  { label: 'Protección Total', key: 'seg_ope_pro_total', tipo: 'comp_f' },
  { label: 'OncoAhorros', key: 'seg_ope_onco_ahorros', tipo: 'comp_f' },
];

/**
 * Seguros Operaciones (`/app/presupuesto/lineas/pasivos-patrimonio/seg-ope`) —
 * migrado de `PrePasPatSegurosOperacionesComponent` (legado STG). Sin fórmula
 * derivada, igual que Seguros Comercial (`inputCols: 'all'`).
 */
@Component({
  selector: 'app-seguros-operaciones',
  standalone: true,
  imports: [LineaSimpleComponent],
  template: `<app-linea-simple [config]="config" />`,
})
export class SegurosOperacionesComponent {
  private readonly presupuesto = inject(PresupuestoService);

  protected readonly config: LineaSimpleConfig<FilaSegurosOperaciones> = {
    mainTitle: 'Seguros Operaciones',
    columnas: COLUMNAS,
    paramsHier: { code: 2, maxLvl: 4, dlgTitulo: 'JERARQUIA AGENCIA DEP.' },
    inputCols: 'all',
    obtenerResumen: (tipCod, codRel) => this.presupuesto.obtenerResumenSegOperaciones(tipCod, codRel),
    guardarResumen: (tipCod, codRel, filas) => this.presupuesto.guardarResumenSegOperaciones(tipCod, codRel, filas),
  };
}
