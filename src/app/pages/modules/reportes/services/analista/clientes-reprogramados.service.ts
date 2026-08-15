import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../core/winder/instances/mod-reportes.service';
import { ModSeccionesService } from '../../../../../core/winder/instances/mod-secciones.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../utils/reportes-mapeo.util';
import type { TablaReporteResultado, FilaReporte } from '../../models/tabla-reporte.model';
import type { AsesorSec } from '../../models/analista/asesor-sec.model';
import type { ReprogramacionForm } from '../../models/analista/clientes-reprogramados.model';

/** Datos de "Clientes Reprogramados" (legado `leg/com/rda/sec/repro`, `crs-repro.component.ts`). */
@Injectable({ providedIn: 'root' })
export class ClientesReprogramadosService {
  private readonly reportes = inject(ModReportesService);
  private readonly secciones = inject(ModSeccionesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Cartera de clientes en reprogramación de un asesor (`RES_SEC_REP_01`). */
  obtenerClientes(asesor: { tip_cod: number; cod_rel: string }): Observable<TablaReporteResultado> {
    return this.reportes.getRegularData('RES_SEC_REP_01', asesor).pipe(map(mapearBloqueReporte));
  }

  /**
   * Guarda las respuestas para un cliente — `UP_REPRO_01`. A diferencia de
   * "Encuesta Clientes" (que manda los campos sueltos + un `reaccion` anidado),
   * el legado acá manda el objeto entero como un único string JSON bajo la
   * clave `json` (`{...r.row, ...respuestas}` → `{json: JSON.stringify(...)}`).
   */
  guardar(cliente: FilaReporte, respuestas: ReprogramacionForm): Observable<unknown> {
    return this.secciones.postRegularUpdate('UP_REPRO_01', { json: JSON.stringify({ ...cliente, ...respuestas }) });
  }
}
