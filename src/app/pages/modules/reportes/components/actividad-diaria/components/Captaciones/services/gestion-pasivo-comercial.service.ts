import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import { COLUMNAS_GESTION_PASIVO_COMERCIAL } from '../models/gestion-pasivo-comercial.columnas';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';

/** "Gestión Pasivo Comercial" — legado `actividad-diaria/carterizacion/pasivo` (`CarterizacionComponent`): motor `table.regular`, jerarquía `UNI_1`, sin filtros propios. */
@Injectable({ providedIn: 'root' })
export class GestionPasivoComercialService {
  private readonly bloques = inject(BloqueReporteService);

  obtener(nodo: NodoConsulta): Observable<TablaDinamicaResultado> {
    // El legado ignora las cabeceras del payload (`JSON.parse(r.headers)` está
    // comentado) y usa siempre las suyas — `carterizacion.component.ts`.
    return this.bloques
      .tablaRegular('RS_CARTEPAS_01', nodo)
      .pipe(map((tabla) => ({ ...tabla, columnas: COLUMNAS_GESTION_PASIVO_COMERCIAL })));
  }
}
