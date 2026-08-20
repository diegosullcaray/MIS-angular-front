import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { ModSeccionesService } from '../../../../../../core/winder/instances/mod-secciones.service';
import { ShellStateService } from '../../../../../../core/services/shell-state.service';
import { AsesorSecService } from './asesor-sec.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import { formularioAPayload } from '../models/prospecto-corresponsal.model';
import type { AsesorSec } from '../models/asesor-sec.model';
import type { TablaReporteResultado } from '../../../models/tabla-reporte.model';
import type { OpcionJerarquia, ProspectoCorresponsalForm } from '../models/prospecto-corresponsal.model';

/** Datos de "Prospecto Corresponsal" (legado `leg/com/rda/sec/sec-prosp`, `crs-prospe.component.ts` + `add-prospe.component.ts`). */
@Injectable({ providedIn: 'root' })
export class ProspectoCorresponsalService {
  private readonly reportes = inject(ModReportesService);
  private readonly secciones = inject(ModSeccionesService);
  private readonly asesorSec = inject(AsesorSecService);
  private readonly shell = inject(ShellStateService);

  /** Lista de asesores/sectoristas visibles para el usuario logueado — legado `app-auto-complete-sec`. */
  obtenerAsesores(): Observable<AsesorSec[]> {
    return this.asesorSec.obtenerAsesores();
  }

  /** Prospectos corresponsales registrados por un asesor (`LIS_PROSPE_01`). */
  obtenerProspectos(asesor: { tip_cod: number; cod_rel: string }): Observable<TablaReporteResultado> {
    return this.reportes.getRegularData('LIS_PROSPE_01', asesor).pipe(map(mapearBloqueReporte));
  }

  /** Jerarquía geográfica/organizacional para las selects del formulario "Nuevo" (`SEL_JER_01`) — legado `renderSlcAgencia()`. */
  obtenerJerarquia(): Observable<OpcionJerarquia[]> {
    return this.reportes.getRegularData('SEL_JER_01', {}).pipe(map((r) => mapearBloqueReporte(r).body as unknown as OpcionJerarquia[]));
  }

  /** Registra un nuevo prospecto corresponsal — `ADD_PROS_CORRE_01`, legado `AddProspecomponent.save()`. */
  guardarProspecto(formulario: ProspectoCorresponsalForm): Observable<unknown> {
    const codBt = this.shell.usuarioActivo()?.codBt ?? '';
    return this.secciones.postRegularUpdate('ADD_PROS_CORRE_01', { json: JSON.stringify(formularioAPayload(formulario, codBt)) });
  }
}
