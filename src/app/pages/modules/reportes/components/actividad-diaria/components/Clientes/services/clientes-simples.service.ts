import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../models/captaciones.model';

/**
 * Los reportes de Clientes que salen del `report-cra-v1p1` del legado: un solo
 * bloque, jerarquía `UNI_1` y sin filtros propios.
 */
@Injectable({ providedIn: 'root' })
export class ClientesSimplesService {
  private readonly bloques = inject(BloqueReporteService);

  /** "Clientes Nuevos y Recurrentes" — legado `cli-nue-rec`, `module: 'Clientes_nuevoRec'`. */
  nuevosRecurrentes(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('Clientes_nuevoRec_01', nodo);
  }

  /** "Clientes y Operaciones" — legado `cli-ope`, `module: 'Clientes_Ope'`. */
  operaciones(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('Clientes_Ope_01', nodo);
  }

  /** "Clientes Flujo" — legado `cmg_cliente_flujo`, `module: 'CMG_CLIF'`. */
  cmgFlujo(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('CMG_CLIF_01', nodo);
  }

  /**
   * "Stock de Clientes" — legado `cmg-cli`. Su entrada de `cra-map.ts` tiene el
   * `reportType` comentado, así que va por el strand deprecado y su `cod_rep`
   * es la ruta completa, no una sigla.
   */
  cmgStock(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques
      .deprecado('rda/administracion/clientes/cmg_cliente_01', nodo)
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  private unBloque(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }
}
