import { Component, inject } from '@angular/core';
import { LineaSimpleComponent } from '../linea-simple/linea-simple.component';
import { PresupuestoService } from '../../services/presupuesto.service';
import type { ColumnaTabla, LineaSimpleConfig } from '../../models';

const COLUMNAS: ColumnaTabla[] = [
  { label: 'Fecha', key: 'fec_pro', tipo: 'text' },
  { label: 'Multiriesgo', key: 'a1', tipo: 'comp_f' },
  { label: 'Multicrédito', key: 'a2', tipo: 'comp_f' },
  { label: 'Protección Cuotas', key: 'a3', tipo: 'comp_f' },
  { label: 'Agrícola', key: 'a4', tipo: 'comp_f' },
  { label: 'OncoCréditos', key: 'a5', tipo: 'comp_f' },
  { label: 'Protección Total', key: 'a6', tipo: 'comp_f' },
];

/**
 * Seguros Comercial (`/app/presupuesto/lineas/pasivos-patrimonio/seg-com`) —
 * migrado de `PrePasPatSegurosComercialComponent` (legado STG). Sin fórmula
 * derivada: cada columna es un valor independiente (`inputCols: 'all'`).
 */
@Component({
  selector: 'app-seguros-comercial',
  standalone: true,
  imports: [LineaSimpleComponent],
  template: `<app-linea-simple [config]="config" />`,
})
export class SegurosComercialComponent {
  private readonly presupuesto = inject(PresupuestoService);

  protected readonly config: LineaSimpleConfig = {
    mainTitle: 'Seguros Comercial',
    columnas: COLUMNAS,
    paramsHier: { code: 9, maxLvl: 5, dlgTitulo: 'JERARQUIA ADMIN. COMER.' },
    inputCols: 'all',
    obtenerResumen: (tipCod, codRel) => this.presupuesto.obtenerResumenSegComercial(tipCod, codRel),
    guardarResumen: (tipCod, codRel, filas) => this.presupuesto.guardarResumenSegComercial(tipCod, codRel, filas),
  };
}
