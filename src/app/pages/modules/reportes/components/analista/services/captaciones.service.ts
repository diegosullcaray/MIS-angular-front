import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { ReporteCaptaciones } from '../models/captaciones.model';
import { COD_ANALISTA_MULTIBLOQUE } from '../constantes/analista.constantes';

/** Datos de "Captaciones" (legado `leg/com/rda/sec/capta`, `ReportCrsV1Component` + `crs-map.ts`: `rda/sectorista/captaciones/captacion_sec`). */
@Injectable({ providedIn: 'root' })
export class CaptacionesService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Captaciones de un asesor — 3 bloques (`..._sec_01`/`_02`/`_03`). */
  obtenerCaptaciones(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteCaptaciones> {
    return forkJoin({
      tabla1: this.bloque(COD_ANALISTA_MULTIBLOQUE.captaciones[0], asesor),
      tabla2: this.bloque(COD_ANALISTA_MULTIBLOQUE.captaciones[1], asesor),
      tabla3: this.bloque(COD_ANALISTA_MULTIBLOQUE.captaciones[2], asesor),
    });
  }

  /** Un bloque del reporte, ya mapeado. */
  private bloque(codRep: string, asesor: { tip_cod: number; cod_rel: string }) {
    return this.reportes.getDeprecatedData(codRep, asesor).pipe(map(mapearBloqueReporte));
  }

}
