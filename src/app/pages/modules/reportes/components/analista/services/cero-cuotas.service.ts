import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { ReporteCeroCuotas } from '../models/cero-cuotas.model';
import { COD_ANALISTA } from '../constantes/analista.constantes';

/** Datos de "Cero Cuotas" (legado `leg/com/rda/sec/zu-cuo`, título real "Cero y Una Cuota", `ReportCrsV1Component` + `crs-map.ts`: `rda/sectorista/cero_cuota/cero_cuota_sec`). */
@Injectable({ providedIn: 'root' })
export class CeroCuotasService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Clientes con cero/una cuota impaga de un asesor — único bloque (`cero_cuota_sec_01`). */
  obtenerCeroCuotas(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteCeroCuotas> {
    return this.reportes
      .getDeprecatedData(COD_ANALISTA.ceroCuotas, asesor)
      .pipe(map((respuesta) => ({ tabla1: mapearBloqueReporte(respuesta) })));
  }
}
