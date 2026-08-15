import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../utils/reportes-mapeo.util';
import { fechaUltimoDia } from '../utils/fecha-reporte.util';
import type { AsesorSec } from '../models/analista/asesor-sec.model';
import type { TablaReporteResultado } from '../models/tabla-reporte.model';
import type { ReportePlanillaMovilidad } from '../models/analista/planilla-movilidad.model';

const TABLA_VACIA: TablaReporteResultado = { headers: [], body: [], additional: {} };

/**
 * Datos de "Planilla de Movilidad" (legado `leg/com/rda/sec/plan-mov-sec`,
 * `ReportCrsv5Component` + `crs-map.ts`: `PLANMOV`).
 *
 * `ReportCrsv5Component` es funcionalmente idéntico a `ReportCrsV1Component`
 * (mismo `renderTable()`/`getMixData()`, sin filtros propios en `crs-map.ts`
 * para este módulo) — no se migra como algo distinto.
 *
 * `reportType: ReportType.REGULAR` en `crs-map.ts` ⇒ strand moderno
 * `regularData`, 4 bloques, todos con el parámetro fijo `fec` (`fec_day_ult`
 * del legado, "ayer" en `YYYYMMDD` — ver `fechaUltimoDia()`).
 *
 * El backend puede devolver 500 para un bloque puntual sin datos (confirmado:
 * `PLANMOV_03` con "Resultado vacio para: regularData", `NullPointerException`)
 * — en el legado cada `app-table-multiheader` pide su propio bloque por
 * separado y solo ese bloque queda en estado de error (`confT.results(true,
 * false, true)`), sin afectar a los demás. Acá se replica lo mismo: un
 * bloque que falla se resuelve como tabla vacía en vez de tirar abajo los 4
 * con `forkJoin` (que por defecto cancela todo el grupo ante el primer error).
 */
@Injectable({ providedIn: 'root' })
export class PlanillaMovilidadService {
  private readonly reportes = inject(ModReportesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Planilla de movilidad de un asesor — 4 bloques (`PLANMOV_01/_02/_03/_04`), cada uno tolerante a fallas propias. */
  obtenerPlanillaMovilidad(asesor: { tip_cod: number; cod_rel: string }): Observable<ReportePlanillaMovilidad> {
    const params = { ...asesor, fec: fechaUltimoDia() };
    const pedirBloque = (codRep: string) =>
      this.reportes.getRegularData(codRep, params).pipe(
        map(mapearBloqueReporte),
        catchError((err: unknown) => {
          console.error(`No se pudo cargar ${codRep}`, err);
          return of(TABLA_VACIA);
        })
      );
    return forkJoin({
      tabla1: pedirBloque('PLANMOV_01'),
      tabla2: pedirBloque('PLANMOV_02'),
      tabla3: pedirBloque('PLANMOV_03'),
      tabla4: pedirBloque('PLANMOV_04'),
    });
  }
}
