import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../services/bloque-reporte.service';
import { moverSemaforosTrasSuValor } from '../../../utils/semaforo-tras-valor.util';
import type { ReporteBloqueUnico } from '../models/captaciones.model';

/** "CMG Captaciones - Agencias" — legado `cmg-capta01`, `cra-map.ts`: `module: 'GCMGCAP'`, `jerar: OFI_1`. */
@Injectable({ providedIn: 'root' })
export class CmgCaptacionesAgenciasService {
  private readonly bloques = inject(BloqueReporteService);

  /**
   * En `GCMGCAP_01` cada semáforo (`TMM_Sem`, `TAM_Sem`, `TFM_Sem`, `Dist_Sem`)
   * viene JUSTO ANTES de la métrica que califica, que lo absorbe con `cols:2`.
   * Se lo pasa detrás para que el punto quede a la derecha del número; "METAS"
   * no tiene semáforo propio y queda sin punto.
   */
  obtener(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular('GCMGCAP_01', nodo).pipe(map((t) => ({ tabla1: moverSemaforosTrasSuValor(t) })));
  }
}
