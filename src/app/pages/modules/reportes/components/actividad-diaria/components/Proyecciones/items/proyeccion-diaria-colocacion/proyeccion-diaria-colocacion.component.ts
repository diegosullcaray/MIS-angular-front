import { Component, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ReporteSimpleComponent, type PestanaReporte } from '../../../../../../ui/reporte-simple/reporte-simple.component';
import { ReporteBloquesBase } from '../../../../../../ui/reporte-simple/reporte-bloques.base';
import { PARAMS_HIER_UNIDAD } from '../../../../../../models/jerarquia.model';
import type { NodoConsulta } from '../../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../../models/tabla-reporte.model';
import { ProyeccionesService } from '../../services/proyecciones.service';

/**
 * "Proyección diaria colocación" (`leg/com/rda/adm/proy_M2`) — legado
 * `PROYEC_DIACOLREC`.
 *
 * Su entrada del mapa declara un tercer bloque (`_03`, "por efectividades") pero
 * está comentado: solo se piden `_01` y `_02`.
 */
@Component({
  selector: 'app-proyeccion-diaria-colocacion',
  standalone: true,
  imports: [ReporteSimpleComponent],
  templateUrl: './proyeccion-diaria-colocacion.component.html',
  styleUrl: './proyeccion-diaria-colocacion.component.css',
})
export class ProyeccionDiariaColocacionComponent extends ReporteBloquesBase {
  private readonly servicio = inject(ProyeccionesService);

  protected readonly paramsHier = PARAMS_HIER_UNIDAD;

  protected readonly titulos = ['Proyección diaria por operaciones', 'Proyección diaria por colocaciones'];

  /**
   * Una pestaña por tabla en vez de las dos apiladas: son dos vistas del mismo
   * corte (operaciones y colocaciones) y no se leen juntas.
   */
  protected pestanas(): PestanaReporte[] {
    const bloques = this.bloques();
    return [
      { id: 'operaciones', titulo: 'Por operaciones', bloques: bloques.slice(0, 1) },
      { id: 'colocaciones', titulo: 'Por colocaciones', bloques: bloques.slice(1, 2) },
    ];
  }

  protected consultar(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.servicio.diariaColocacion(nodo);
  }
}
