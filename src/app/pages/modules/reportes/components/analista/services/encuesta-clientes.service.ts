import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { ModSeccionesService } from '../../../../../../core/winder/instances/mod-secciones.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import type { TablaReporteResultado, FilaReporte } from '../../../models/tabla-reporte.model';
import type { AsesorSec } from '../models/asesor-sec.model';
import { formularioAJson } from '../models/encuesta-clientes.model';
import type { CiiuOpcion, EncuestaClienteForm } from '../models/encuesta-clientes.model';

/** Datos de "Encuesta Clientes" (legado `leg/com/rda/sec/cap-ret`, `crs-cap-ret.component.ts`). */
@Injectable({ providedIn: 'root' })
export class EncuestaClientesService {
  private readonly reportes = inject(ModReportesService);
  private readonly secciones = inject(ModSeccionesService);
  private readonly asesorSec = inject(AsesorSecService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Cartera de clientes de un asesor (`LIS_CAPRET_01`). */
  obtenerClientes(asesor: { tip_cod: number; cod_rel: string }): Observable<TablaReporteResultado> {
    return this.reportes.getRegularData('LIS_CAPRET_01', asesor).pipe(map(mapearBloqueReporte));
  }

  /** Lista CIIU (sector económico → giros de negocio) para el select "Giro de negocio" — `SEL_CIU_02`. Misma forma `result.body` que un reporte regular (legado `renderSlcCiu()`). */
  obtenerCiiu(): Observable<CiiuOpcion[]> {
    return this.reportes.getRegularData('SEL_CIU_02', {}).pipe(map((r) => mapearBloqueReporte(r).body as unknown as CiiuOpcion[]));
  }

  /** Guarda las respuestas de la encuesta para un cliente — `UPD_CAPRET_01`. `reaccion` va con las `variable` snake_case originales del legado, no camelCase. */
  guardarEncuesta(cliente: FilaReporte, respuestas: EncuestaClienteForm): Observable<unknown> {
    return this.secciones.postRegularUpdate('UPD_CAPRET_01', { ...cliente, reaccion: formularioAJson(respuestas) });
  }
}
