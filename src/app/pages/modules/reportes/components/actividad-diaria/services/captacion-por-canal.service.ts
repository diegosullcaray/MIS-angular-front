import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../models/captaciones.model';

/** "Captaciones por Canal" (CAPTACIONES RED) — legado `cap-age`, `jerar: OFI_1`. Su entrada de `cra-map.ts` no declara `reportType`, así que va por el strand deprecado. */
@Injectable({ providedIn: 'root' })
export class CaptacionPorCanalService {
  private readonly bloques = inject(BloqueReporteService);

  obtener(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques
      .deprecado('rda/administracion/captaciones/captacion_canal_01', nodo)
      .pipe(map((tabla1) => ({ tabla1 })));
  }
}
