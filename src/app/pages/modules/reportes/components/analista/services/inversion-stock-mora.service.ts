import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloquesGrafico } from '../../../utils/reportes-mapeo.util';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { ReporteInversionStockMora } from '../models/inversion-stock-mora.model';
import { COD_ANALISTA } from '../constantes/analista.constantes';

/** Datos de "Inversión y Stock de Mora" (legado `leg/com/rda/sec/inv-stk`, `ReportCrsV2Component` + `crs-map.ts`: `rda/sectorista/brecha/brecha_inversion_sec`, bloque `graphic` en vez de `table`). */
@Injectable({ providedIn: 'root' })
export class InversionStockMoraService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Gráficos de inversión y stock de mora de un asesor — único bloque (`brecha_inversion_sec_01`), puede traer varios gráficos. */
  obtenerGraficos(asesor: { tip_cod: number; cod_rel: string }): Observable<ReporteInversionStockMora> {
    return this.reportes
      .getGraphicData(COD_ANALISTA.inversionStockMora, asesor)
      .pipe(map((respuesta) => ({ graficos: mapearBloquesGrafico(respuesta) })));
  }
}
