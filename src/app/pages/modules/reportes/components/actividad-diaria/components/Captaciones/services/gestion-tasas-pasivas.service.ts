import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { ReporteDosBloques } from '../models/captaciones.model';
import { BLOQUES_TASAS_PASIVAS } from '../constantes/captaciones.constantes';

/** Filtros propios del reporte — `agr` (`Tipo01`) y `var` (`Canal01`) del legado. */
export interface FiltrosTasasPasivas {
  agr: number;
  var: number;
}

/** "Gestión de Tasas Pasivas" — legado `tasa-pas`. Los dos bloques se distinguen por `calc`. */
@Injectable({ providedIn: 'root' })
export class GestionTasasPasivasService {
  private readonly bloques = inject(BloqueReporteService);

  obtener(nodo: NodoConsulta, filtros: FiltrosTasasPasivas): Observable<ReporteDosBloques> {
    return this.bloques
      .regulares(
        BLOQUES_TASAS_PASIVAS.map(({ codRep, calc }) => ({ codRep, extra: { ...filtros, calc } })),
        nodo,
      )
      .pipe(map(([tabla1, tabla2]) => ({ tabla1, tabla2 })));
  }
}
