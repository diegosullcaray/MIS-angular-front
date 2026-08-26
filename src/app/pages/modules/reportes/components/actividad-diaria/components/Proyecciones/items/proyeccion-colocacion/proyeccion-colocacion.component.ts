import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { ProyeccionesService } from '../../services/proyecciones.service';

/**
 * "Proyección colocación" (`leg/com/rda/adm/proy_M1`) — legado `PROYEC_COLREC`
 * (host `cra-v11`), dos bloques con el mismo encabezado.
 */
@Component({
  selector: 'app-proyeccion-colocacion',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './proyeccion-colocacion.component.html',
  styleUrl: './proyeccion-colocacion.component.css',
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

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.colocacion(nodo);
  }
}
