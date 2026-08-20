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

/** Datos de "CMG Captaciones - Agencias" (legado `leg/com/rda/adm/cmg-capta01`, `ReportCraV1p1Component` + `cra-map.ts`: `module: 'GCMGCAP'`). */
@Injectable({ providedIn: 'root' })
export class CmgCaptacionesService {
  private readonly reportes = inject(ModReportesService);

  /** CMG de captaciones de una agencia — único bloque (`GCMGCAP_01`). */
  obtenerCmgCaptaciones(nodo: Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel'>): Observable<ReporteCmgCaptaciones> {
    return this.reportes
      .getRegularData(COD_REP, { ...nodo, fec: fechaUltimoDia() })
      .pipe(map((respuesta) => ({ tabla1: corregirSemaforosDesplazados(mapearBloqueReporte(respuesta)) })));
  }
}
