import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import { COD_CAPTACIONES } from '../constantes/captaciones.constantes';

/** "Vinculación Cartera" — legado `actividad-diaria/carterizacion-com/pasivocom` (`CarterizacionCapComComponent`, título "Vinculación de Cartera - Captaciones"): motor `table.regular`, jerarquía `UNI_1`, sin filtros propios. */
@Injectable({ providedIn: 'root' })
export class VinculacionCarteraService {
  private readonly bloques = inject(BloqueReporteService);

  obtener(nodo: NodoConsulta): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegular(COD_CAPTACIONES.vinculacionCartera, nodo);
  }
}
