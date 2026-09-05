import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';
import { COD_COMERCIAL_EJECUTIVO } from '../constantes/comercial-ejecutivo.constantes';

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
    return this.unBloque(COD_COMERCIAL_EJECUTIVO.desembolsos, nodo);
  }

  /** "Clientes" — legado `cli` (`Clientes`). Ojo: el `cod_rep` va con esa capitalización exacta. */
  clientes(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_COMERCIAL_EJECUTIVO.clientes, nodo);
  }

  /** "Agro" — legado `agro` (`AGRO`). */
  agro(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_COMERCIAL_EJECUTIVO.agro, nodo);
  }

  /** "PDM" — legado `pdm` (`PDM`). */
  pdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_COMERCIAL_EJECUTIVO.pdm, nodo);
  }

  private unBloque(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }
}
