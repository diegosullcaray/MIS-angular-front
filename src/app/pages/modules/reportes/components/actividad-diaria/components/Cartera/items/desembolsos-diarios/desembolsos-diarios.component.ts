import { Component, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent, type PestanaReporte } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { CarteraCraService } from '../../services/cartera-cra.service';

/** "Desembolsos Diarios" (`leg/com/rda/adm/desem-dia`) — legado `DesemDiario` sobre el host `cra-v1p2`. */
@Component({
  selector: 'app-desembolsos-diarios',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './desembolsos-diarios.component.html',
})
export class DesembolsosDiariosComponent extends ReporteBloquesBase {
  private readonly servicio = inject(CarteraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly titulos = [
    'Desembolsos diarios',
    'Desembolsos habilitados para posible contratación electrónica',
    'Desembolsos por contratación electrónica',
    'Participación de contratación electrónica en desembolsos habilitados',
    'Participación de contratación electrónica en desembolsos totales',
  ];

  /** El host `cra-v1p2` deja el primer bloque en su propia pestaña y agrupa los otros cuatro. */
  protected readonly tabs = computed<PestanaReporte[]>(() => {
    const b = this.bloques();
    return [
      { id: 'diarios', titulo: 'Desembolsos diarios', bloques: b.slice(0, 1) },
      { id: 'electronica', titulo: 'Contratación electrónica', bloques: b.slice(1) },
    ];
  });

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.desembolsosDiarios(nodo);
  }
}
