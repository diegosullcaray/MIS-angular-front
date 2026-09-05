import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ModReportesService } from '../../../../../core/winder/instances/mod-reportes.service';
import { mapearBloqueReporte } from '../../utils/reportes-mapeo.util';
import type { ReporteControlCargas } from './control-cargas.model';
import { COD_CONTROL_CARGAS, OPCION_CONTROL_CARGAS } from './constantes/control-cargas.constantes';

/** Datos de "Control de Cargas" (`leg/prd`). Las dos tablas salen del mismo reporte y las diferencia el filtro `opt`. */
@Injectable({ providedIn: 'root' })
export class ControlCargasService {
  private readonly ant = inject(ModReportesService);

  obtenerReporte(): Observable<ReporteControlCargas> {
    return forkJoin({
      produccion: this.ant.getRegularData(COD_CONTROL_CARGAS, { opt: OPCION_CONTROL_CARGAS.produccion }).pipe(map(mapearBloqueReporte)),
      procesos: this.ant.getRegularData(COD_CONTROL_CARGAS, { opt: OPCION_CONTROL_CARGAS.procesos }).pipe(map(mapearBloqueReporte)),
    });
  }
}
