import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { ReporteCampanaAgil } from '../models/campana-agil.model';
import { COD_ANALISTA } from '../constantes/analista.constantes';

/** Datos de "Campaña Ágil" (legado `leg/com/rda/sec/cam-agl`, `ReportCrsV1Component` + `crs-map.ts`: `rda/sectorista/campania_agil/campana_agil_sec`). */
@Injectable({ providedIn: 'root' })
export class CampanaAgilService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Campaña ágil de un asesor para una semana — único bloque (`campana_agil_sec_01`). */
  obtenerCampanaAgil(asesor: { tip_cod: number; cod_rel: string }, semana: number): Observable<ReporteCampanaAgil> {
    return this.reportes
      .getDeprecatedData(COD_ANALISTA.campanaAgil, { ...asesor, sem: semana })
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}
