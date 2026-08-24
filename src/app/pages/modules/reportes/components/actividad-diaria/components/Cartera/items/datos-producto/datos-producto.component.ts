import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { CarteraCraService } from '../../services/cartera-cra.service';

/** "Datos por Producto" (`leg/com/rda/adm/dat-prod`) — legado `RS_DAT_PRO`, cuatro bloques apilados. */
@Component({
  selector: 'app-datos-producto',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './datos-producto.component.html',
  styleUrl: './datos-producto.component.css',
})
export class DatosProductoComponent extends ReporteBloquesBase {
  private readonly servicio = inject(CarteraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  /** Solo el primer bloque trae título en el legado; los otros tres se apilan sin encabezado propio. */
  protected readonly titulos = ['Datos por producto'];

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.datosProducto(nodo);
  }
}
