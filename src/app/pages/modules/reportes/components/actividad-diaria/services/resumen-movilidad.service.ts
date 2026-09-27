import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../components/Captaciones/models/captaciones.model';
import { COD_RESUMEN_MOVILIDAD } from '../constantes/resumen-movilidad.constantes';

/** Los dos Resúmenes de Movilidad usan hosts distintos: paginado y regular exacto. */
@Injectable({ providedIn: 'root' })
export class ResumenMovilidadService {
  private readonly bloques = inject(BloqueReporteService);

  /** Resumen de Movilidad Comercial. */
  comercial(nodo: NodoConsulta, pagina = 1): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regularPaginado(COD_RESUMEN_MOVILIDAD.comercial, nodo, {}, pagina)
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Resumen de Movilidad · Recuperaciones (RESNMOVR_01) */
  recuperaciones(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    const params = { fec: this.bloques.fec() };
    return this.bloques
      .regularExacto(COD_RESUMEN_MOVILIDAD.recuperaciones, nodo, params)
      .pipe(map((tabla1) => ({ tabla1 })));
  }
}
