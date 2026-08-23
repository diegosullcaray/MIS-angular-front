import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../core/services/shell-state.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import { corregirSemaforosDesplazados } from '../../../utils/semaforos-desplazados.util';
import { fechaCorteCompacta } from '../../../utils/fecha-reporte.util';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { ReporteCmgCaptaciones } from '../models/cmg-captaciones.model';

/** `cod_rep` del único bloque: `module` + `table[0].id` del legado (`GCMGCAP` + `_01`). */
const COD_REP = 'GCMGCAP_01';

/** Datos de "CMG Captaciones - Agencias" (legado `leg/com/rda/adm/cmg-capta01`, `ReportCraV1p1Component` + `cra-map.ts`: `module: 'GCMGCAP'`). */
@Injectable({ providedIn: 'root' })
export class CmgCaptacionesService {
  private readonly reportes = inject(ModReportesService);
  private readonly shell = inject(ShellStateService);

  /**
   * CMG de captaciones de una agencia — único bloque (`GCMGCAP_01`), a la fecha
   * de corte del backend (el mismo `fec` con el que el selector pide la jerarquía).
   *
   * `GCMGCAP_01` tiene la misma forma que `DESEMP_SOC_01` (METAS · TMM · TAM ·
   * TFM · DISTANCIA) y arrastra el mismo desfase: cada semáforo viaja pegado a
   * la métrica ANTERIOR pero colorea la SIGUIENTE, así que "METAS" no tiene
   * punto propio y el último (TFM) se quedaba sin el suyo.
   */
  obtenerCmgCaptaciones(nodo: Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel'>): Observable<ReporteCmgCaptaciones> {
    const fec = fechaCorteCompacta(this.shell.usuarioActivo()?.fechaCorte);
    return this.reportes
      .getRegularData(COD_REP, { ...nodo, fec })
      .pipe(map((respuesta) => ({ tabla1: corregirSemaforosDesplazados(mapearBloqueReporte(respuesta)) })));
  }
}
