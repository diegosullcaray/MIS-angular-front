import { Injectable, inject } from '@angular/core';
import { Observable, map, tap } from 'rxjs';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { ShellStateService } from '../../../../../../core/services/shell-state.service';
import { mapearBloqueReporte } from '../../../utils/reportes-mapeo.util';
import { corregirSemaforosDesplazados } from '../../../utils/semaforos-desplazados.util';
import { fechaCorteCompacta } from '../../../utils/fecha-reporte.util';
import type { HierarquiaNodo } from '../../../models/jerarquia.model';
import type { ReporteCmgCaptaciones } from '../models/cmg-captaciones.model';

const COD_REP = 'GCMGCAP_01';

@Injectable({ providedIn: 'root' })
export class CmgCaptacionesService {
  private readonly reportes = inject(ModReportesService);
  private readonly shell = inject(ShellStateService);

  obtenerCmgCaptaciones(nodo: Pick<HierarquiaNodo, 'tip_cod' | 'cod_rel'>): Observable<ReporteCmgCaptaciones> {
    const fec = fechaCorteCompacta(this.shell.usuarioActivo()?.fechaCorte);
    
    // Imprime el nodo en formato JSON listo para copiar
    console.log('--- NODO ENVIADO ---');
    console.log(JSON.stringify(nodo, null, 2));

    return this.reportes
      .getRegularData(COD_REP, { ...nodo, fec })
      .pipe(
        // Imprime la respuesta del backend en formato JSON listo para copiar
        tap((respuesta) => {
          console.log('--- DATA RECIBIDA DEL BACKEND ---');
          console.log(JSON.stringify(respuesta, null, 2));
        }),
        
        map((respuesta) => ({ tabla1: corregirSemaforosDesplazados(mapearBloqueReporte(respuesta)) }))
      );
  }
}