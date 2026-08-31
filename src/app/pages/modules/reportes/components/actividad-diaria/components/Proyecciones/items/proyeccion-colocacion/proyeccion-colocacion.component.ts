import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent, type PestanaReporte } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { ProyeccionesService } from '../../services/proyecciones.service';

/**
 * "Proyección colocación" (`leg/com/rda/adm/proy_M1`) — legado `PROYEC_COLREC`
 * (host `cra-v11`), dos bloques con el mismo encabezado.
 *
 * Los dos van en pestañas en vez de apilados: el `_01` es el resumen —el que
 * lleva la nota de "Total de Proyecciones"— y el `_03` el detalle. Cada uno
 * conserva adentro el `content.higher` del mapa, que en este reporte es el
 * mismo para ambos.
 */
@Component({
  selector: 'app-proyeccion-colocacion',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './proyeccion-colocacion.component.html',
})
export class ProyeccionColocacionComponent extends ReporteBloquesBase {
  private readonly servicio = inject(ProyeccionesService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  /** Los dos bloques declaran el mismo `content.higher` en `com-map.module.ts`. */
  protected readonly titulos = [
    'Colocaciones (número de operaciones y montos de desembolso)',
    'Colocaciones (número de operaciones y montos de desembolso)',
  ];

  /** Solo el `_01` trae `content.lower`. */
  protected override readonly notas = [
    '<b>Total de Proyecciones</b> → Cli. Evaluado + Listo para comité + Listo para desembolso',
    undefined,
  ];

  /** Una pestaña por bloque, en el orden del mapa (`_01` y después `_03`). */
  protected pestanas(): PestanaReporte[] {
    const bloques = this.bloques();
    return [
      { id: 'resumen', titulo: 'Resumen', bloques: bloques.slice(0, 1) },
      { id: 'detalle', titulo: 'Detalle', bloques: bloques.slice(1, 2) },
    ];
  }

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.colocacion(nodo);
  }
}
