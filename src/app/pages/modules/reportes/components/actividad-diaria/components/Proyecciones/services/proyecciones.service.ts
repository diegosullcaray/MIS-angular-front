import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';

/**
 * Los dos reportes de "Proyecciones".
 *
 * Se parecen pero no comparten infraestructura, y las dos diferencias son de las
 * que no dan error:
 *
 * - "Proyección colocación" (`PROYEC_COLREC`) vive en `com-map.module.ts` con su
 *   `reportType` COMENTADO, así que cae en el `ReportType.DEPRECATED` por
 *   defecto de `report.ts` → strand `reportData`, no `regularData`.
 * - Sus ids además no son correlativos: declara `_01` y `_03` (no hay `_02`),
 *   el mismo patrón que `RS_AGE_COM_CR` en Portafolio Reasignado.
 */
@Injectable({ providedIn: 'root' })
export class ProyeccionesService {
  private readonly bloques = inject(BloqueReporteService);

  /** "Proyección colocación" — legado `proy_M1` (`PROYEC_COLREC`, host `cra-v11`). */
  colocacion(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return forkJoin([
      this.bloques.deprecado('PROYEC_COLREC_01', nodo),
      this.bloques.deprecado('PROYEC_COLREC_03', nodo),
    ]);
  }

  /** "Proyección diaria colocación" — legado `proy_M2` (`PROYEC_DIACOLREC`), sin parámetros propios. */
  diariaColocacion(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares([{ codRep: 'PROYEC_DIACOLREC_01' }, { codRep: 'PROYEC_DIACOLREC_02' }], nodo);
  }
}
