import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { ReporteAutonomiaTasas } from '../models/autonomia-tasas.model';
import { BLOQUES_AUTONOMIA_TASAS_ANALISTA } from '../constantes/analista.constantes';

/** Datos de "Reporte de Autonomía de Tasas" (legado `leg/com/rda/sec/aut-tasa`, `ReportCrsV1Component` + `crs-map.ts`: `rda/sectorista/Reporte_Autonomia_Tasas/reporte_autonomia_tasa_sec`). */
@Injectable({ providedIn: 'root' })
export class AutonomiaTasasService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Autonomía de tasas de un asesor — 4 bloques, cada uno con su propio `var` fijo. */
  obtenerAutonomiaTasas(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteAutonomiaTasas> {
    const [b1, b2, b3, b4] = BLOQUES_AUTONOMIA_TASAS_ANALISTA;
    const bloque = ({ codRep, var: variante }: { codRep: string; var: string }) =>
      this.reportes.getDeprecatedData(codRep, { ...asesor, var: variante }).pipe(map(mapearBloqueReporte));
    return forkJoin({ tabla1: bloque(b1), tabla2: bloque(b2), tabla3: bloque(b3), tabla4: bloque(b4) });
  }
}
