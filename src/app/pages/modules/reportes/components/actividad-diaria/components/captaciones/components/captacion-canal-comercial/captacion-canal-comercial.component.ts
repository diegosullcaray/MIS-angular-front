import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs'; // 1️⃣ Importar 'tap' de rxjs
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteSimpleBase } from '../../../../../../ui/reporte-simple/reporte-simple.base';
import { SelectFiltroComponent } from '../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import { OPCIONES_PRODUCTO_PASIVO, TODOS } from '../../../../../../models/filtros.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../models/captaciones.model';
import { CaptacionCanalComercialService } from '../../services/captacion-canal-comercial.service';

@Component({
  selector: 'app-captacion-canal-comercial',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './captacion-canal-comercial.component.html',
  styleUrl: './captacion-canal-comercial.component.css',
})
export class CaptacionCanalComercialComponent extends ReporteSimpleBase {
  private readonly servicio = inject(CaptacionCanalComercialService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;
  protected readonly opcionesProducto = OPCIONES_PRODUCTO_PASIVO;
  protected readonly producto = signal<string>(TODOS);

  protected consultar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    // 2️⃣ Usar pipe y tap para hacer el console.log de la respuesta
    return this.servicio.obtener(nodo, this.producto()).pipe(
      tap((respuesta) => console.log('✅ Data de Captación Canal Comercial:', respuesta))
    );
  }
}