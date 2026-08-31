import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';

/**
 * Los cuatro reportes de "Comercial Ejecutivo".
 *
 * Son el caso más simple del legado: los cuatro salen del host `cra-v1p1`, con
 * jerarquía `UNI_1`, strand `regularData` y un único bloque `_01` sin
 * parámetros propios — solo cambia el `cod_rep`.
 */
@Injectable({ providedIn: 'root' })
export class ComercialEjecutivoService {
  private readonly bloques = inject(BloqueReporteService);

  /** "Desembolsos" — legado `desem-reacfae` (`DESEMBOLSOS`, "sin FAE ni Reactiva"). */
  desembolsos(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('DESEMBOLSOS_01', nodo);
  }

  /** "Clientes" — legado `cli` (`Clientes`). Ojo: el `cod_rep` va con esa capitalización exacta. */
  clientes(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('Clientes_01', nodo);
  }

  /** "Agro" — legado `agro` (`AGRO`). */
  agro(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('AGRO_01', nodo);
  }

  /** "PDM" — legado `pdm` (`PDM`). */
  pdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('PDM_01', nodo);
  }

  private unBloque(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }
}
