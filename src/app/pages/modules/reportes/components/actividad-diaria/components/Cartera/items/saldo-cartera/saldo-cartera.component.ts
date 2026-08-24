import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent, type PestanaReporte } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { CarteraCraService } from '../../services/cartera-cra.service';

/** "Saldo Cartera" (`leg/com/rda/adm/saldo`) — legado `RS_SAL_CAR`, cinco bloques apilados. */
@Component({
  selector: 'app-saldo-cartera',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './saldo-cartera.component.html',
  styleUrl: './saldo-cartera.component.css',
})
export class SaldoCarteraComponent extends ReporteBloquesBase {
  private readonly servicio = inject(CarteraCraService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  /** Títulos de los bloques `_04`, `_05`, `_01`, `_02` y `_03`, en el orden del legado. */
  protected readonly titulos = [
    'Saldo puntual de cartera vigente',
    'Cartera por producto vigente',
    'Saldo puntual de cartera',
    'Cartera por producto',
    'Productividad',
  ];

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.saldoCartera(nodo);
  }

  /**
   * El host del legado apila los cinco bloques; acá se agrupan en dos pestañas
   * (`_04`/`_05` vigentes, `_01`/`_02`/`_03` totales) para no scrollear tanto.
   */
  protected pestanas(): PestanaReporte[] | undefined {
    const tablas = this.tablas();
    if (tablas.length === 0) return undefined;

    return [
      {
        id: 'vigente',
        titulo: 'Saldo Vigente',
        bloques: [
          { titulo: this.titulos[0], tabla: tablas[0] },
          { titulo: this.titulos[1], tabla: tablas[1] }
        ]
      },
      {
        id: 'total',
        titulo: 'Saldo Total',
        bloques: [
          { titulo: this.titulos[2], tabla: tablas[2] },
          { titulo: this.titulos[3], tabla: tablas[3] },
          { titulo: this.titulos[4], tabla: tablas[4] }
        ]
      }
    ];
  }
}
