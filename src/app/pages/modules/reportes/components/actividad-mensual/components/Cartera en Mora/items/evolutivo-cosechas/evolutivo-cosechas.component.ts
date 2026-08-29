import { Component, inject, signal } from '@angular/core';
import type { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../../models/tabla-reporte.model';
import {
  OPCIONES_PRODUCTO_COSECHAS,
  PRODUCTO_COSECHAS_POR_DEFECTO,
  OPCIONES_SUBPRODUCTO_COSECHAS,
  SUBPRODUCTO_COSECHAS_POR_DEFECTO,
  OPCIONES_MADURACION,
  MADURACION_POR_DEFECTO,
  OPCIONES_TIPO_OPERACION_SALDO,
  TIPO_OPERACION_SALDO_POR_DEFECTO,
} from '../../../../models/actividad-mensual-filtros.model';
import { ActividadMensualCraService } from '../../../../services/actividad-mensual-cra.service';

/** "Evolutivo Cosechas" (`leg/com/rma/adm/graf-cosechas`). */
@Component({
  selector: 'app-mensual-evolutivo-cosechas',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './evolutivo-cosechas.component.html',
  styleUrl: './evolutivo-cosechas.component.css',
})
export class EvolutivoCosechasComponent extends ReporteSimpleBase {
  private readonly servicio = inject(ActividadMensualCraService);
  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly opcionesProducto = OPCIONES_PRODUCTO_COSECHAS;
  protected readonly producto = signal<string>(PRODUCTO_COSECHAS_POR_DEFECTO);

  protected readonly opcionesSubproducto = OPCIONES_SUBPRODUCTO_COSECHAS;
  protected readonly subproducto = signal<string>(SUBPRODUCTO_COSECHAS_POR_DEFECTO);

  protected readonly opcionesMaduracion = OPCIONES_MADURACION;
  protected readonly maduracion = signal<string>(MADURACION_POR_DEFECTO);

  protected readonly opcionesTipo = OPCIONES_TIPO_OPERACION_SALDO;
  protected readonly tipo = signal<string>(TIPO_OPERACION_SALDO_POR_DEFECTO);

  protected override consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.servicio.evolutivoCosechas(nodo, this.producto(), this.subproducto(), this.maduracion(), this.tipo());
  }
}
