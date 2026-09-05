import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import { COD_PROYECCIONES } from '../constantes/proyecciones.constantes';

/** Servicios para reportes de Proyecciones. */
@Injectable({ providedIn: 'root' })
export class ProyeccionesService {
  private readonly bloques = inject(BloqueReporteService);

  /** Reporte de Proyección de Colocación. */
  colocacion(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fec = this.bloques.fec();
    return forkJoin([
      this.bloques.regularLento(COD_PROYECCIONES.colocacionConFecha, nodo, { fec }),
      this.bloques.regularLento(COD_PROYECCIONES.colocacionSinFecha, nodo),
    ]);
  }

  /** Reporte de Proyección Diaria de Colocación. */
  diariaColocacion(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      COD_PROYECCIONES.diariaColocacion.map((codRep) => ({ codRep })),
      nodo,
    );
  }
}
