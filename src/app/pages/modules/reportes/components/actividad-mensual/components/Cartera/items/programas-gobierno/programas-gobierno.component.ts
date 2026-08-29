import { Component, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import {
  generarOpcionesFechaBase,
  fechaBasePorDefecto,
} from '../../../../models/actividad-mensual-filtros.model';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';

/** "Programas del Gobierno" (`leg/com/rma/adm/pro-gob-m`). */
@Component({
  selector: 'app-mensual-programas-gobierno',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './programas-gobierno.component.html',
  styleUrl: './programas-gobierno.component.css',
})
export class ProgramasGobiernoComponent extends ReporteBloquesBase {
  private readonly servicio = inject(ActividadMensualCraService);
  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesFechaBase = generarOpcionesFechaBase();
  protected readonly fechaBase = signal<string>(fechaBasePorDefecto());

  protected override readonly titulos = [
    'Saldo Capital',
    'Cartera Atrasada',
    'N° Clientes',
    'N° Operaciones',
  ] as const;

  protected override consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.programasGobierno(nodo, this.fechaBase());
  }
}
