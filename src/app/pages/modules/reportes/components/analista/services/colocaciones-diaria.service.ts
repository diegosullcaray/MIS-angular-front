import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { ReporteColocacionesDiaria } from '../models/colocaciones-diaria.model';

/** Datos de "Colocaciones diaria Operación, Monto y Recuperación" (legado `leg/com/rda/sec/proy_M6`, `ReportCrsV1Component` + `crs-map.ts`: `PROYEC_DIACOLREC_AS`). */
@Injectable({ providedIn: 'root' })
export class ColocacionesDiariaService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Colocaciones diarias de un asesor — 3 bloques (`PROYEC_DIACOLREC_AS_01/_02/_03`). */
  obtenerColocacionesDiaria(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteColocacionesDiaria> {
    return forkJoin({
      tabla1: this.reportes.getRegularData('PROYEC_DIACOLREC_AS_01', asesor).pipe(map(mapearBloqueReporte)),
      tabla2: this.reportes.getRegularData('PROYEC_DIACOLREC_AS_02', asesor).pipe(map(mapearBloqueReporte)),
      tabla3: this.reportes.getRegularData('PROYEC_DIACOLREC_AS_03', asesor).pipe(map(mapearBloqueReporte)),
    });
  }
}
