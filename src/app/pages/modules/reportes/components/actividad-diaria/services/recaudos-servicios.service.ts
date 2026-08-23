import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../models/captaciones.model';

/** "Recaudo de Servicios" — legado `recaudo-serv-pas`, `module: 'RECSERV_PAS'`, `jerar: MAC_2`, sin filtros propios. */
@Injectable({ providedIn: 'root' })
export class RecaudosServiciosService {
  private readonly bloques = inject(BloqueReporteService);

  obtener(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular('RECSERV_PAS_01', nodo).pipe(map((tabla1) => ({ tabla1 })));
  }
}
