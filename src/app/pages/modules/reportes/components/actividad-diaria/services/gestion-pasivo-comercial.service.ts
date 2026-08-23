import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../models/captaciones.model';

/** "Gestión Pasivo Comercial" (Captación por Canal Operaciones) — legado `capta-caract-canal-operacional`, `module: 'CARACT_pas'`, `jerar: MAC_2`, filtros `prod` y `segmento`. */
@Injectable({ providedIn: 'root' })
export class GestionPasivoComercialService {
  private readonly bloques = inject(BloqueReporteService);

  obtener(nodo: NodoConsulta, prod: string, segmento: string): Observable<ReporteBloqueUnico> {
    return this.bloques.regular('CARACT_pas_01', nodo, { prod, segmento }).pipe(map((tabla1) => ({ tabla1 })));
  }
}
