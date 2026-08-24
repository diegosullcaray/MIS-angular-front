import { Component, computed, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent, type PestanaReporte } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { CarteraCraService } from '../../services/cartera-cra.service';

/** "Reporte de Autonomía de Tasas" (`leg/com/rda/adm/aut-tasa`) — legado `GST_ACTIVAS` sobre el host `cra-aut-tasa`. */
@Component({
  selector: 'app-autonomia-tasas',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './autonomia-tasas.component.html',
  styleUrl: './autonomia-tasas.component.css',
})
export class AutonomiaTasasComponent extends ReporteBloquesBase {
  private readonly servicio = inject(CarteraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  /** Un título por bloque, en el orden en que los pide el service (`var` 1..8, 10, 9). */
  protected readonly titulos = [
    'Número de operaciones desembolsadas por producto y nivel de tasas (días hábiles)',
    '% operaciones con autonomía desembolsada por producto y nivel de tasas (días hábiles)',
    'TAPP Mes de operaciones desembolsadas por producto y nivel de tasas (días hábiles)',
    'Evolución de operaciones desembolsadas por nivel de tasas (días hábiles)',
    'Evolución de monto desembolsado por nivel de tasas (días hábiles)',
    'Evolución de TAPP Mes (días hábiles)',
    'Número de operaciones desembolsadas por producto y nivel de tasas (días hábiles)',
    'TAPP Mes de operaciones desembolsadas por producto y nivel de tasas (días hábiles)',
    'TAPP Mes de operaciones desembolsadas por producto y nivel de tasas (días hábiles)',
    'Número de operaciones desembolsadas por producto y nivel de tasas (días hábiles)',
  ];

  /** El host `cra-aut-tasa` reparte los bloques por índice, no por orden. */
  protected readonly tabs = computed<PestanaReporte[]>(() => {
    const b = this.bloques();
    const tomar = (...i: number[]) => i.map((n) => b[n]).filter(Boolean);
    return [
      { id: 'nivel', titulo: 'Por Nivel', bloques: tomar(6, 7) },
      { id: 'rango', titulo: 'Por Rango', bloques: tomar(8, 9) },
      { id: 'producto', titulo: 'Por producto', bloques: tomar(0, 1, 2) },
      { id: 'evolutivo', titulo: 'Evolutivo', bloques: tomar(3, 4, 5) },
    ];
  });

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.autonomiaTasas(nodo);
  }
}
