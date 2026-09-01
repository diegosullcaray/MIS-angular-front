import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../models/captaciones.model';
import { COD_CAPTACIONES } from '../constantes/captaciones.constantes';

/** "CMG Captaciones - Agencias" — legado `cmg-capta01`. */
@Injectable({ providedIn: 'root' })
export class CmgCaptacionesAgenciasService {
  private readonly bloques = inject(BloqueReporteService);

  /**
   * `GCMGCAP_01` manda cada semáforo (`TMM_Sem`, `TAM_Sem`, `TFM_Sem`, `Dist_Sem`) justo antes
   * de la métrica que califica, oculto, con `cols:2` en la métrica para que la absorba. Eso ya
   * pone el punto a la izquierda del número — el orden natural del payload, sin tocarlo.
   */
  obtener(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(COD_CAPTACIONES.cmgCaptacionesAgencias, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }
}
