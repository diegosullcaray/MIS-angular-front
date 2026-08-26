import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { CarteraMoraCraService } from '../../services/cartera-mora-cra.service';

/** "Portafolios y Supervisión" (`leg/com/rda/adm/port-sup`) — legado `PORTSUPE`, dos bloques apilados. */
@Component({
  selector: 'app-portafolios-supervision',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './portafolios-supervision.component.html',
  styleUrl: './portafolios-supervision.component.css',
})
export class PortafoliosSupervisionComponent extends ReporteBloquesBase {
  private readonly servicio = inject(CarteraMoraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  /** Títulos de `content.higher` de cada bloque, en el orden del legado. */
  protected readonly titulos = ['Portafolios y Supervisión', ''];

  /** Ambos bloques del legado declaran la misma unidad como leyenda. */
  protected override readonly notas = ['<b>Expresado en PEN y %</b>', '<b>Expresado en PEN y %</b>'];

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.portafoliosSupervision(nodo);
  }
}
