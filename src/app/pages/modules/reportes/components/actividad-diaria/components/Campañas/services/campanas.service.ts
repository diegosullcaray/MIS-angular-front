import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { ReporteBloqueUnico } from '../../Captaciones/models/captaciones.model';

/** Los filtros propios de "Agendamiento" — `fuga`, `prop` y el rango `nom`. */
export interface FiltrosAgenda {
  fuga: number;
  prop: number;
  rango: number;
}

/**
 * Los tres reportes de "Campañas".
 *
 * Apadrinamiento y Mentoring salen del motor "mixto"; Agendamiento vive en el
 * repositorio y va por `table.regular` con `fecha` (con guiones) y sus tres
 * filtros.
 */
@Injectable({ providedIn: 'root' })
export class CampanasService {
  private readonly bloques = inject(BloqueReporteService);

  /**
   * "Apadrinamiento" — legado `cam-apa` (`R_APADRINA_01`), "Tramo 1-30".
   *
   * Su bloque declara el corte como `fecha`, no como el `fec` que agrega
   * `BloqueReporteService` por su cuenta.
   */
  apadrinamiento(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regular('R_APADRINA_01', nodo, { fecha: this.bloques.fec() })
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  /**
   * "Reporte Mentoring" — legado `RMentoring` (`RMENTORIN_01`, host `cra-v1p7`).
   *
   * El mapa declara un segundo bloque ("Créditos Grupales") pero está comentado.
   */
  mentoring(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular('RMENTORIN_01', nodo).pipe(map((tabla1) => ({ tabla1 })));
  }

  /**
   * "Agendamiento" — legado `repositorio/agenda-comercial`.
   *
   * Cuatro tablas: el `RS_AGE_COM_01` por sus dos `mode` (resumen y detalle por
   * nivel) más el `_02` y el `_03`, que además reciben el rango como `nom`.
   */
  agendamiento(nodo: NodoConsulta, filtros: FiltrosAgenda): Observable<TablaDinamicaResultado[]> {
    const base = {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      fecha: this.bloques.fecha(),
      fuga: filtros.fuga,
      prop: filtros.prop,
    };
    return forkJoin([
      this.bloques.tablaRegularCon('RS_AGE_COM_01', { ...base, mode: 1 }),
      this.bloques.tablaRegularCon('RS_AGE_COM_01', { ...base, mode: 2 }),
      this.bloques.tablaRegularCon('RS_AGE_COM_02', { ...base, mode: 1, nom: filtros.rango }),
      this.bloques.tablaRegularCon('RS_AGE_COM_03', { ...base, mode: 1, nom: filtros.rango }),
    ]);
  }
}
