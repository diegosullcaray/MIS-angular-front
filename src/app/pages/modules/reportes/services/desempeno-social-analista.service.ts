import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/analista/asesor-sec.model';
import type { ReporteDesempenoSocialAnalista } from '../models/analista/desempeno-social-analista.model';

/**
 * Datos de "Desempeño Social" de analista/sectorista (legado
 * `leg/com/rda/sec/desempeno-social-as`, `ReportCrsV1Component` +
 * `crs-map.ts`: `DESE_SOC_AS`).
 *
 * `reportType: ReportType.REGULAR` en `crs-map.ts` ⇒ strand moderno
 * `regularData`. No confundir con "Desempeño Social" de administración
 * (`DesarrolloSostenibleService.obtenerDesempenoSocial()`, `cod_rep:
 * 'DESEMP_SOC_01'`) — es un reporte y `cod_rep` distinto del legado.
 */
@Injectable({ providedIn: 'root' })
export class DesempenoSocialAnalistaService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Desempeño social de un asesor — único bloque (`DESE_SOC_AS_01`). */
  obtenerDesempenoSocial(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteDesempenoSocialAnalista> {
    return this.reportes
      .getRegularData('DESE_SOC_AS_01', asesor)
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}
