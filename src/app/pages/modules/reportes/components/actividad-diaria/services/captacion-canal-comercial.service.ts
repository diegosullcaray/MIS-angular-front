import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../models/captaciones.model';

/** "Captación por Canal Comercial" — legado `capta-caract-canal-comercial`, `module: 'CARACT_CARTERA'`, `jerar: UNI_1`, filtro `prod`. */
@Injectable({ providedIn: 'root' })
export class CaptacionCanalComercialService {
  private readonly bloques = inject(BloqueReporteService);

  obtener(nodo: NodoConsulta, prod: string): Observable<ReporteBloqueUnico> {
    return this.bloques.regular('CARACT_CARTERA_01', nodo, { prod }).pipe(map((tabla1) => ({ tabla1 })));
  }
}
