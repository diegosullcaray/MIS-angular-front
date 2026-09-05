import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../../../ui/reporte-simple/reporte-bloques.base';
import { SelectFiltroComponent } from '../../../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_UNIDAD } from '../../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../../../models/tabla-reporte.model';
import {
  OPCIONES_PRODUCTO_NUEVO_INGRESO,
  OPCIONES_TIPO_CUOTA,
  PRODUCTO_NUEVO_INGRESO_POR_DEFECTO,
  TIPO_CUOTA_POR_DEFECTO,
} from '../../../../models/cartera-en-mora.model';
import { CeroCuotasNuevasService } from '../../../../services/cero-cuotas-nuevas.service';

/**
 * "Cuadro de Mando" de Cero Cuotas Nuevas (`leg/com/rda/adm/cmd-cerocuotanueva`)
 * — legado `CMCUONUEV`, dos bloques que comparten los mismos dos filtros.
 */
@Component({
  selector: 'app-cero-cuotas-cuadro-mando',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './cuadro-mando.component.html',
})
export class CeroCuotasCuadroMandoComponent extends ReporteBloquesBase {
  private readonly servicio = inject(CeroCuotasNuevasService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly opcionesProducto = OPCIONES_PRODUCTO_NUEVO_INGRESO;
  protected readonly opcionesTipo = OPCIONES_TIPO_CUOTA;

  protected readonly producto = signal(PRODUCTO_NUEVO_INGRESO_POR_DEFECTO);
  protected readonly tipo = signal(TIPO_CUOTA_POR_DEFECTO);

  protected readonly titulos = ['Cuadro de Mando', 'Cuadro de Mando Tipo Reprogramado vs Producto'];

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.cuadroMando(nodo, { prod: this.producto(), tipcuota: this.tipo() });
  }
}
