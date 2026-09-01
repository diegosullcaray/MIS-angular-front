import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../models/captaciones.model';
import { COD_CAPTACIONES } from '../constantes/captaciones.constantes';

/** "Captación por Canal Comercial" — legado `capta-caract-canal-comercial`, filtro `prod`. */
@Injectable({ providedIn: 'root' })
export class CaptacionCanalComercialService {
  private readonly bloques = inject(BloqueReporteService);

  obtener(nodo: NodoConsulta, prod: string): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(COD_CAPTACIONES.captacionCanalComercial, nodo, { prod }).pipe(map((tabla1) => ({ tabla1 })));
  }
}
