import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { ModSeccionesService } from '../../../../../../core/winder/instances/mod-secciones.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import { formularioAJson } from '../models/datos-clientes.model';
import type { TablaReporteResultado, FilaReporte } from '../../../models/tabla-reporte.model';
import type { DatosClienteForm, OpcionDato, ReferenciaBantotal } from '../models/datos-clientes.model';
import { COD_ANALISTA } from '../constantes/analista.constantes';

/** Datos de "Datos Clientes" (legado `leg/com/rda/sec/cli-act`, `crs-cli-act.component.ts`). */
@Injectable({ providedIn: 'root' })
export class DatosClientesService {
  private readonly reportes = inject(ModReportesService);
  private readonly secciones = inject(ModSeccionesService);

  /** Cartera de clientes de un asesor (`DET_CLI_01`). */
  obtenerClientes(asesor: { tip_cod: number; cod_rel: string }): Observable<TablaReporteResultado> {
    return this.reportes.getRegularData(COD_ANALISTA.datosClientes, asesor).pipe(map(mapearBloqueReporte));
  }

  /** Lista CIIU para los selects "CIIU - 1/2/3" — `SEL_CIU_01` (distinta de `SEL_CIU_02`, la de "Encuesta Clientes"). */
  obtenerCiiu(): Observable<OpcionDato[]> {
    return this.reportes.getRegularData(COD_ANALISTA.datosClientesCiudades, {}).pipe(map((r) => mapearBloqueReporte(r).body as unknown as OpcionDato[]));
  }

  /** Guarda los datos de contacto de un cliente — `UPD_CLI_01`. */
  guardar(cliente: FilaReporte, form: DatosClienteForm, referencia: ReferenciaBantotal): Observable<unknown> {
    return this.secciones.postRegularUpdate(COD_ANALISTA.datosClientesGuardar, { json: JSON.stringify({ ...cliente, ...formularioAJson(form, referencia) }) });
  }
}
