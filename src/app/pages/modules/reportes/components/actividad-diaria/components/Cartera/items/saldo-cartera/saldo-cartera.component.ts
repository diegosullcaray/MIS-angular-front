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

  /** `content.lower` de cada bloque en `cra-map.ts` del legado (`RS_SAL_CAR`), mismo orden que `titulos`. */
  protected override readonly notas = [
    '<b>*Considerar que los saldos de cartera no incluyen los ajustes de traslados GECO que se realizarán para el pago del REVA.</b>',
    undefined,
    '<b>*Considerar que los saldos de cartera no incluyen los ajustes de traslados GECO que se realizarán para el pago del REVA.</b>',
    undefined,
    '<b>a:</b> Variación con respecto al cierre del mes anterior.',
  ];

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.saldoCartera(nodo);
  }

  /**
   * El host del legado apila los cinco bloques; acá se agrupan en dos pestañas
   * (`_04`/`_05` vigentes, `_01`/`_02`/`_03` totales) para no scrollear tanto.
   */
  protected pestanas(): PestanaReporte[] | undefined {
    const bloques = this.bloques();
    if (bloques.length === 0) return undefined;

    return [
      {
        id: 'vigente',
        titulo: 'Saldo Vigente',
        bloques: bloques.slice(0, 2),
      },
      {
        id: 'total',
        titulo: 'Saldo Total',
        bloques: bloques.slice(2),
      }
    ];
  }
}
