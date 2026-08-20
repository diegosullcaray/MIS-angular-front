import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { ReporteAutonomias } from '../models/autonomias.model';

/** Datos de "Autonomías" (legado `leg/com/rda/sec/aut`, `ReportCrsV1Component` + `crs-map.ts`: `LST_AUT`). */
@Injectable({ providedIn: 'root' })
export class AutonomiasService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Autonomías de un asesor — único bloque (`LST_AUT_01`). */
  obtenerAutonomias(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteAutonomias> {
    return this.reportes
      .getRegularData('LST_AUT_01', { ...asesor, c_aut: 3, aut: 2 })
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}
