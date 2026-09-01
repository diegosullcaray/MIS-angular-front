import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../models/captaciones.model';
import { COD_CAPTACIONES } from '../constantes/captaciones.constantes';

/**
 * Los tres reportes "CMG Clientes Pasivo" del legado (`cmg-cli-pas*`), que
 * comparten jerarquía (`OFI_1`) y solo cambian de `cod_rep` y de filtros.
 */
@Injectable({ providedIn: 'root' })
export class CmgClientesPasivosService {
  private readonly bloques = inject(BloqueReporteService);

  /** Flujo — filtro `agru`. */
  flujo(nodo: NodoConsulta, agru: string): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_CAPTACIONES.clientesPasivosFlujo, nodo, { agru });
  }

  /** Stock — sin filtros. Ojo: su bloque es el `_02`, no el `_01` como los otros dos. */
  stock(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_CAPTACIONES.clientesPasivosStock, nodo);
  }

  /** Detalle del flujo — filtros `agru` y `grupo`. */
  flujoDetalle(nodo: NodoConsulta, agru: string, grupo: string): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_CAPTACIONES.clientesPasivosFlujoDetalle, nodo, { agru, grupo });
  }

  private unBloque(codRep: string, nodo: NodoConsulta, extra?: Record<string, unknown>): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo, extra).pipe(map((tabla1) => ({ tabla1 })));
  }
}
