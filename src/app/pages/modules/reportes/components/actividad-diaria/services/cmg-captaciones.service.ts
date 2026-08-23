import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../services/bloque-reporte.service';
import { corregirSemaforosDesplazados } from '../../../utils/semaforos-desplazados.util';
import type { ReporteBloqueUnico } from '../models/captaciones.model';

/** "CMG Captaciones - Agencias" — legado `cmg-capta01`, `cra-map.ts`: `module: 'GCMGCAP'`, `jerar: OFI_1`. */
@Injectable({ providedIn: 'root' })
export class CmgCaptacionesAgenciasService {
  private readonly bloques = inject(BloqueReporteService);

  /**
   * `GCMGCAP_01` comparte forma con `DESEMP_SOC_01` (METAS · TMM · TAM · TFM ·
   * DISTANCIA) y el mismo desfase: cada semáforo viaja pegado a la métrica
   * ANTERIOR pero colorea la SIGUIENTE, así que "METAS" no lleva punto propio.
   */
  obtener(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular('GCMGCAP_01', nodo).pipe(map((t) => ({ tabla1: corregirSemaforosDesplazados(t) })));
  }
}
