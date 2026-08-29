import { Component, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../../../ui/reporte-simple/reporte-simple.base';
import { SelectFiltroComponent } from '../../../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_MACRO_SIN_CORREDOR } from '../../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../../../../models/tabla-reporte.model';
import {
  OPCIONES_PRODUCTO_PASIVO,
  PRODUCTO_PASIVO_POR_DEFECTO,
  OPCIONES_SEGMENTO,
  SEGMENTO_POR_DEFECTO,
  generarOpcionesFechaBase,
  fechaBasePorDefecto,
} from '../../../../../../models/actividad-mensual-filtros.model';
import { ActividadMensualCraService } from '../../../../../../services/actividad-mensual-cra.service';

/** "Captación Operacional" (`leg/com/rma/adm/capta-caract-canal-operacional-m`). */
@Component({
  selector: 'app-mensual-captacion-operacional',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './captacion-operacional.component.html',
  styleUrl: './captacion-operacional.component.css',
})
export class CaptacionOperacionalComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ActividadMensualCraService);
  protected readonly paramsHier = PARAMS_HIER_MACRO_SIN_CORREDOR;
  protected readonly opcionesFechaBase = generarOpcionesFechaBase();
  protected readonly fechaBase = signal<string>(fechaBasePorDefecto());
  protected readonly opcionesProducto = OPCIONES_PRODUCTO_PASIVO;
  protected readonly producto = signal<string>(PRODUCTO_PASIVO_POR_DEFECTO);
  protected readonly opcionesSegmento = OPCIONES_SEGMENTO;
  protected readonly segmento = signal<string>(SEGMENTO_POR_DEFECTO);

  protected override consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.captacionOperacional(nodo, this.producto(), this.segmento(), this.fechaBase());
  }
}
