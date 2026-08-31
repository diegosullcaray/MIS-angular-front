import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { CarteraMoraCraService } from '../../services/cartera-mora-cra.service';

/** "Cero y una Cuota" (`leg/com/rda/adm/zu-cuo`) — legado `CEROYCUOTA`, un bloque por cada corte. */
@Component({
  selector: 'app-cero-una-cuota',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './cero-una-cuota.component.html',
})
export class CeroUnaCuotaComponent extends ReporteBloquesBase {
  private readonly servicio = inject(CarteraMoraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  /** Títulos de `content.higher` de cada bloque, en el orden del legado. */
  protected readonly titulos = ['Cero Cuota', 'Una Cuota'];

  /** Solo el segundo bloque trae `content.lower` en `cra-map.ts`. */
  protected override readonly notas = [
    undefined,
    '<b>a: </b>Var. del número de operaciones, respecto al cierre del mes anterior.<br>' +
      '<b>b: </b>Var. del porcentaje de participación del total de créditos, respecto al cierre del mes anterior.',
  ];

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.ceroUnaCuota(nodo);
  }
}
