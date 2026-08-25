import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../models/captaciones.model';

/**
 * Los dos reportes de "Seguimiento Banca Preferente" del legado
 * (`cap-segui-bp` y `gest-red-ag`), ambos con jerarquía `OFI_3` (solo FC).
 */
@Injectable({ providedIn: 'root' })
export class SeguimientoBancaPreferenteService {
  private readonly bloques = inject(BloqueReporteService);

  /** "Seguimiento Captaciones Banca Preferente" — `module: 'CAP_SEGUI_BP'`, filtro `prod`. */
  bancaPreferente(nodo: NodoConsulta, prod: string): Observable<ReporteBloqueUnico> {
    return this.unBloque('CAP_SEGUI_BP_01', nodo, { prod });
  }

  /** "Gestión Red de Agencias" — `module: 'CAP_SEGUI_FC_BP'`, sin filtros. */
  redAgencias(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('CAP_SEGUI_FC_BP_01', nodo);
  }

  private unBloque(codRep: string, nodo: NodoConsulta, extra?: Record<string, unknown>): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo, extra).pipe(map((tabla1) => ({ tabla1 })));
  }
}
