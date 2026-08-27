import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { PARAMS_HIER_OFICINA } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { TableroDigitalService } from '../../services/tablero-digital.service';

/**
 * "APP Cliente - Home Banking" (`leg/com/rda/adm/tab-digital`) — legado
 * `TABDIG`, host `cra-v1p4`, jerarquía `OFI_1`.
 *
 * El único del módulo con dos bloques. Su entrada del mapa no declara
 * `content.higher`, así que las tablas van sin título, como en el legado.
 */
@Component({
  selector: 'app-app-cliente-home-banking',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './app-cliente-home-banking.component.html',
})
export class AppClienteHomeBankingComponent extends ReporteBloquesBase {
  private readonly servicio = inject(TableroDigitalService);

  protected readonly paramsHier = PARAMS_HIER_OFICINA;

  /** Sin títulos: el mapa no declara `content.higher` para ninguno de los dos. */
  protected readonly titulos = [];

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.appClienteHomeBanking(nodo);
  }
}
