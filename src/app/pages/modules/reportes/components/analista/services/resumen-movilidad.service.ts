import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { ReporteResumenMovilidad } from '../models/resumen-movilidad.model';

/** Datos de "Resumen de Movilidad" (legado `leg/com/rda/sec/res-mov-sec`, `ReportCrsV1Component` + `crs-map.ts`: `RESNMOV`). */
@Injectable({ providedIn: 'root' })
export class ResumenMovilidadService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Resumen de movilidad de un asesor — único bloque (`RESNMOV_02`). */
  obtenerResumenMovilidad(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteResumenMovilidad> {
    return this.reportes
      .getRegularData('RESNMOV_02', asesor)
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}
