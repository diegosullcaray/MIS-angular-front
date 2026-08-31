import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { CarteraMoraCraService } from '../../services/cartera-mora-cra.service';

/** "Top Variables de Riesgos" (`leg/com/rda/adm/top-efec`) — legado `RSRTOPV`, el mismo bloque por tres cortes. */
@Component({
  selector: 'app-top-variables-riesgo',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './top-variables-riesgo.component.html',
})
export class TopVariablesRiesgoComponent extends ReporteBloquesBase {
  private readonly servicio = inject(CarteraMoraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  /** Títulos de `content.higher` de cada bloque, en el orden del legado. */
  protected readonly titulos = ['Ranking Variables de Riesgos — Top Grupo', 'Top Corredores', 'Top Unidades'];

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.topVariablesRiesgo(nodo);
  }
}
