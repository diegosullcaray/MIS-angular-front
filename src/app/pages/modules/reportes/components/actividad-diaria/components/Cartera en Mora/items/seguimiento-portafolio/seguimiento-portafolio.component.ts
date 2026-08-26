import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { CarteraMoraCraService } from '../../services/cartera-mora-cra.service';

/** "Seguimiento de Portafolio" (`leg/com/rda/adm/ava-port`) — legado `RS_AVA_POR`, el bloque `_01` por sus tres `mode`. */
@Component({
  selector: 'app-seguimiento-portafolio',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './seguimiento-portafolio.component.html',
  styleUrl: './seguimiento-portafolio.component.css',
})
export class SeguimientoPortafolioComponent extends ReporteBloquesBase {
  private readonly servicio = inject(CarteraMoraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  /** Títulos de `content.higher` de cada bloque, en el orden del legado. */
  protected readonly titulos = [
    'Portafolio con potencial ingreso a mora > 1',
    'Portafolio por grupo',
    'Créditos cuota ballon y no minorista',
  ];

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.seguimientoPortafolio(nodo);
  }
}
