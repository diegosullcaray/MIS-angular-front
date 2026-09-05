import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';
import { COD_CAPTACIONES } from '../constantes/captaciones.constantes';

/** "Captaciones por Canal" (CAPTACIONES RED) — legado `cap-age`. Su entrada de `cra-map.ts` no declara `reportType`, así que va por el strand deprecado. */
@Injectable({ providedIn: 'root' })
export class CaptacionPorCanalService {
  private readonly bloques = inject(BloqueReporteService);

  obtener(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques
      .deprecado(COD_CAPTACIONES.captacionPorCanal, nodo)
      .pipe(map((tabla1) => ({ tabla1 })));
  }
}
