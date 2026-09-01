import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { ReporteDosBloques } from '../models/captaciones.model';
import { BLOQUES_PANEL_OPERACIONES } from '../constantes/captaciones.constantes';

/** "Panel Operaciones" — legado `panel-operaciones`, `module: 'TB_PANEL_OPE'`, `jerar: MAC_2`, filtro `prod`. */
@Injectable({ providedIn: 'root' })
export class PanelOperacionesService {
  private readonly bloques = inject(BloqueReporteService);

  obtener(nodo: NodoConsulta, prod: string): Observable<ReporteDosBloques> {
    return this.bloques
      .regulares(
        BLOQUES_PANEL_OPERACIONES.map((codRep) => ({ codRep, extra: { prod } })),
        nodo,
      )
      .pipe(map(([tabla1, tabla2]) => ({ tabla1, tabla2 })));
  }
}
