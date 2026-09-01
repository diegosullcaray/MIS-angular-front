import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';

/** Servicios para reportes de Proyecciones. */
@Injectable({ providedIn: 'root' })
export class ProyeccionesService {
  private readonly bloques = inject(BloqueReporteService);

  /** Reporte de Proyección de Colocación. */
  colocacion(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fec = this.bloques.fec();
    return forkJoin([
      this.bloques.regularLento('PROYEC_COLREC_01', nodo, { fec }),
      this.bloques.regularLento('PROYEC_COLREC_03', nodo),
    ]);
  }

  /** Reporte de Proyección Diaria de Colocación. */
  diariaColocacion(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares([{ codRep: 'PROYEC_DIACOLREC_01' }, { codRep: 'PROYEC_DIACOLREC_02' }], nodo);
  }
}
