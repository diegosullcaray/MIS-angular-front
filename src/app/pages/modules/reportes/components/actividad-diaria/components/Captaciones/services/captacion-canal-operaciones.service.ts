import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../models/captaciones.model';
import { COD_CAPTACIONES } from '../constantes/captaciones.constantes';

/** "Captación por Canal Operaciones" — legado `capta-caract-canal-operacional`, filtros `prod` y `segmento`. */
@Injectable({ providedIn: 'root' })
export class CaptacionCanalOperacionesService {
  private readonly bloques = inject(BloqueReporteService);

  obtener(nodo: NodoConsulta, prod: string, segmento: string): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(COD_CAPTACIONES.captacionCanalOperaciones, nodo, { prod, segmento }).pipe(map((tabla1) => ({ tabla1 })));
  }
}
