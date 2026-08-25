import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../../core/winder/instances/mod-reportes.service';
import { mapearBloqueReporte } from '../../utils/reportes-mapeo.util';
import type { ReporteControlCargas } from './control-cargas.model';

const COD_REP = 'RS_MON_CAR_01';

/** Datos de "Control de Cargas" (`leg/prd`, legado `cod_rep: RS_MON_CAR_01`) — mismo `cod_rep` para ambas tablas, diferenciadas por `opt` (`opt:2` = fuentes de producción, `opt:1` = procesos diarios). */
@Injectable({ providedIn: 'root' })
export class ControlCargasService {
  private readonly ant = inject(ModReportesService);

  obtenerReporte(): Observable<ReporteControlCargas> {
    return forkJoin({
      produccion: this.ant.getRegularData(COD_REP, { opt: 2 }).pipe(map(mapearBloqueReporte)),
      procesos: this.ant.getRegularData(COD_REP, { opt: 1 }).pipe(map(mapearBloqueReporte)),
    });
  }
}
