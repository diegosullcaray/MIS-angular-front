import { Component, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../../ui/reporte-simple/reporte-simple.base';
import { SelectFiltroComponent } from '../../../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_UNIDAD } from '../../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../../../../models/tabla-reporte.model';
import {
  OPCIONES_PRODUCTO_PASIVO,
  PRODUCTO_PASIVO_POR_DEFECTO,
  generarOpcionesFechaBase,
  fechaBasePorDefecto,
} from '../../../../../../models/actividad-mensual-filtros.model';
import { ActividadMensualCraService } from '../../../../../../services/actividad-mensual-cra.service';

/** "Captación por Canal (Comercial)" (`leg/com/rma/adm/capta-caract-canal-comercial-m`). */
@Component({
  selector: 'app-mensual-captacion-canal-comercial',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './captacion-canal.component.html',
  styleUrl: './captacion-canal.component.css',
})
export class CaptacionCanalComercialComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ActividadMensualCraService);
  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesFechaBase = generarOpcionesFechaBase();
  protected readonly fechaBase = signal<string>(fechaBasePorDefecto());
  protected readonly opcionesProducto = OPCIONES_PRODUCTO_PASIVO;
  protected readonly producto = signal<string>(PRODUCTO_PASIVO_POR_DEFECTO);

  protected override consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.captacionCanalComercial(nodo, this.producto(), this.fechaBase());
  }
}
