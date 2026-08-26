import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';

/**
 * Los dos reportes de "Proyecciones".
 *
 * Se parecen pero no comparten infraestructura:
 *
 * - "Proyección colocación" (`PROYEC_COLREC`) cuelga del host `report-cra-v11`,
 *   que llama `cs.getRegularData()` directamente: va por `regularData` aunque
 *   su entrada de `com-map.module.ts` tenga el `reportType` comentado. El
 *   `reportType` del mapa solo lo miran los hosts que usan `getMixData`.
 *   Ese host tampoco agrega `fec`, de ahí el `regularExacto()`.
 * - Sus ids además no son correlativos: declara `_01` y `_03` (no hay `_02`),
 *   el mismo patrón que `RS_AGE_COM_CR` en Portafolio Reasignado.
 */
@Injectable({ providedIn: 'root' })
export class ProyeccionesService {
  private readonly bloques = inject(BloqueReporteService);

  /** "Proyección colocación" — legado `proy_M1` (`PROYEC_COLREC`, host `cra-v11`). */
  colocacion(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fec = this.bloques.fec();
    return forkJoin([
      this.bloques.regularExacto('PROYEC_COLREC_01', nodo, { fec }),
      this.bloques.regularExacto('PROYEC_COLREC_03', nodo),
    ]);
  }

  /** "Proyección diaria colocación" — legado `proy_M2` (`PROYEC_DIACOLREC`), sin parámetros propios. */
  diariaColocacion(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares([{ codRep: 'PROYEC_DIACOLREC_01' }, { codRep: 'PROYEC_DIACOLREC_02' }], nodo);
  }
}
