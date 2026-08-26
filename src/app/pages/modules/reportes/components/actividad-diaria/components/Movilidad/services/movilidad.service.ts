import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../Captaciones/models/captaciones.model';

/**
 * Los dos "Resumen de Movilidad", que en el legado cuelgan del nodo raíz de
 * Actividad Diaria y no de un nodo propio.
 *
 * Comparten dominio pero NO infraestructura: cada uno usa un host y una
 * jerarquía distintos, así que no se pueden atender con el mismo método.
 */
@Injectable({ providedIn: 'root' })
export class MovilidadService {
  private readonly bloques = inject(BloqueReporteService);

  /**
   * "Resumen Movilidad Comercial" — legado `res-mov` (`RESNMOV`).
   *
   * Es del host paginado `report-cra-V10`: hay que mandar `pagen` y el nodo
   * COMPLETO (`lvl_hier`, `des_rel`, `lbl_hier`), no solo `tip_cod`/`cod_rel`.
   * Sin eso el backend responde "Resultado vacio para: regularData".
   */
  resumenComercial(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regularPaginado('RESNMOV_01', nodo).pipe(map((tabla1) => ({ tabla1 })));
  }

  /**
   * "Resumen Movilidad Recuperaciones" — legado `res-mov-rec` (`RESNMOVR`,
   * host `cra-v6`).
   *
   * Su jerarquía es `OFI_3`, no `UNI_1`: el componente usa `PARAMS_HIER_FC`.
   */
  resumenRecuperaciones(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular('RESNMOVR_01', nodo).pipe(map((tabla1) => ({ tabla1 })));
  }
}
