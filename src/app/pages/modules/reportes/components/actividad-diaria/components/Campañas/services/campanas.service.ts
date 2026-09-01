import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { OpcionFiltro } from '../../../../../models/filtros.model';
import type { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';
import { TODO } from '../../Portafolio Reasignado/models/portafolio-reasignado.model';

/** Filtros de Agendamiento. */
export interface FiltrosAgenda {
  fuga: number;
  prop: number;
  rango: number;
}

/** Servicios para reportes de Campañas. */
@Injectable({ providedIn: 'root' })
export class CampanasService {
  private readonly bloques = inject(BloqueReporteService);

  /** Reporte de Apadrinamiento. */
  apadrinamiento(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regular('R_APADRINA_01', nodo, { fecha: this.bloques.fec() })
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Opciones de Asesor para Mentoring. */
  opcionesAsesorMentoring(nodo: NodoConsulta): Observable<OpcionFiltro<string>[]> {
    return this.bloques.regularLento('SEL_JER_MENTORING_01', nodo).pipe(
      map((tabla) => [
        { id: TODO, desc: 'TODO' },
        ...tabla.body.map((fila) => ({ id: String(fila['id'] ?? ''), desc: String(fila['desc'] ?? fila['id'] ?? '') })),
      ]),
    );
  }

  /** Reporte de Mentoring. */
  mentoring(nodo: NodoConsulta, resp: string = TODO): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regularLento('RMENTORIN_01', nodo, { fec: this.bloques.fec(), resp })
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Reporte de Agendamiento. */
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
