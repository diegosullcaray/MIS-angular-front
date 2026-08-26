import { Component, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../../../ui/reporte-simple/reporte-bloques.base';
import { SelectFiltroComponent } from '../../../../../../../../../../../shared/ui/formularios/select-filtro/select-filtro.component';
import { PARAMS_HIER_UNIDAD } from '../../../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../../../models/tabla-reporte.model';
import { OPCIONES_TIPO_CUOTA, TIPO_CUOTA_POR_DEFECTO } from '../../../../models/cartera-en-mora.model';
import { CeroCuotasNuevasService } from '../../../../services/cero-cuotas-nuevas.service';

/**
 * "Top" de Cero Cuotas Nuevas (`leg/com/rda/adm/Top-CeroCuota`) — legado
 * `CEROCUOTA_TOPCNUEVA`.
 *
 * Diez bloques: los cinco `id` del mapa, cada uno pedido por sus dos cortes
 * (territorio y unidad) e intercalados en ese orden, que es como los apila el
 * legado en pantalla.
 */
@Component({
  selector: 'app-cero-cuotas-top',
  standalone: true,
  imports: [ReporteSimpleComponent, SelectFiltroComponent],
  templateUrl: './top.component.html',
  styleUrl: './top.component.css',
})
export class CeroCuotasTopComponent extends ReporteBloquesBase {
  private readonly servicio = inject(CeroCuotasNuevasService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly opcionesTipo = OPCIONES_TIPO_CUOTA;
  protected readonly tipo = signal(TIPO_CUOTA_POR_DEFECTO);

  /** Los `content.higher` del legado, en el mismo orden intercalado que devuelve el service. */
  protected readonly titulos = [
    'Top 10 Territorio con mayor saldo cero cuotas',
    'Top 10 Unidad con mayor saldo cero cuotas',
    'Top 5 Territorio nro. cero cuotas nuevo ingreso — tipo producto',
    'Top 5 Unidad nro. cero cuotas nuevo ingreso — tipo producto',
    'Top 5 Territorio saldo cuotas nuevo ingreso — tipo producto',
    'Top 5 Unidad saldo cuotas nuevo ingreso — tipo producto',
    'Top 5 Territorio saldo cuotas nuevo ingreso — tipo repro',
    'Top 5 Unidad saldo cuotas nuevo ingreso — tipo repro',
    'Top 5 Territorio número cuotas nuevo ingreso — tipo repro',
    'Top 5 Unidad número cuotas nuevo ingreso — tipo repro',
  ];

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.top(nodo, { tipcuota: this.tipo() });
  }
}
