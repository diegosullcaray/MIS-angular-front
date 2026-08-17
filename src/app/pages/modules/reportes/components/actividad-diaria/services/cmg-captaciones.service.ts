import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import { corregirSemaforosDesplazados } from '../../../utils/semaforos-desplazados.util';
import { fechaUltimoDia } from '../../../utils/fecha-reporte.util';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { ReporteCmgCaptaciones } from '../models/cmg-captaciones.model';

/** `cod_rep` del único bloque: `module` + `table[0].id` del legado (`GCMGCAP` + `_01`). */
const COD_REP = 'GCMGCAP_01';

/**
 * Datos de "CMG Captaciones - Agencias" (legado `leg/com/rda/adm/cmg-capta01`,
 * `ReportCraV1p1Component` + `cra-map.ts`: `module: 'GCMGCAP'`).
 *
 * `reportType: ReportType.REGULAR` ⇒ strand moderno `regularData`. El único
 * parámetro propio del legado es `fec: fec_day_ult` (día anterior), al que se
 * suma la jerarquía elegida (`tip_cod`/`cod_rel`, `jerar: 'OFI_1'`).
 */
@Injectable({ providedIn: 'root' })
export class CmgCaptacionesService {
  private readonly reportes = inject(ModReportesService);

  /**
   * CMG de captaciones de una agencia — único bloque (`GCMGCAP_01`).
   *
   * Pasa por `corregirSemaforosDesplazados()` porque este reporte emite los
   * semáforos corridos una columna, igual que `DESEMP_SOC_01`: el punto pegado
   * a "METAS" es en realidad el de "TMM". Sin corregirlo, la fila se ve
   * desplazada a la izquierda y "Distancia Metas" queda vacía.
   */
  obtenerCmgCaptaciones(nodo: Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel'>): Observable<ReporteCmgCaptaciones> {
    return this.reportes
      .getRegularData(COD_REP, { ...nodo, fec: fechaUltimoDia() })
      .pipe(map((respuesta) => ({ tabla1: corregirSemaforosDesplazados(mapearBloqueReporte(respuesta)) })));
  }
}
