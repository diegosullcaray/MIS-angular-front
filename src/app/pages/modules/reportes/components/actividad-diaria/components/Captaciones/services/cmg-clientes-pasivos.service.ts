import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../models/captaciones.model';
import { COD_CAPTACIONES } from '../constantes/captaciones.constantes';

/** "CMG Clientes Pasivo" del legado (`cmg-cli-pas`), jerarquía `OFI_1`. */
@Injectable({ providedIn: 'root' })
export class CmgClientesPasivosService {
  private readonly bloques = inject(BloqueReporteService);

  /** Flujo — filtro `agru`. */
  flujo(nodo: NodoConsulta, agru: string): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_CAPTACIONES.clientesPasivosFlujo, nodo, { agru });
  }

  private unBloque(codRep: string, nodo: NodoConsulta, extra?: Record<string, unknown>): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo, extra).pipe(map((tabla1) => ({ tabla1 })));
  }
}
