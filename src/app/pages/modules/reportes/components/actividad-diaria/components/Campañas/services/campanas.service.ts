import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { OpcionFiltro } from '../../../../../models/filtros.model';
import type { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';
import { TODO } from '../../Portafolio Reasignado/models/portafolio-reasignado.model';
import { COD_CAMPANAS } from '../constantes/campanas.constantes';

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
 *
 * Mentoring es el único de los tres con un filtro propio que depende del
 * nivel elegido (el Asesor, `SEL_JER_MENTORING_01`), no de un catálogo fijo.
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
      .regular(COD_CAMPANAS.apadrinamiento, nodo, { fecha: this.bloques.fec() })
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  /**
   * Opciones del filtro "Asesor" de "Reporte Mentoring" — legado
   * `renderUltGestion()`, que las trae de `SEL_JER_MENTORING_01` para el nodo
   * de jerarquía elegido (no es una lista fija: cambia con el nivel).
   *
   * Sin `fec`: el legado la pide con exactamente `{ tip_cod, cod_rel }`.
   */
  opcionesAsesorMentoring(nodo: NodoConsulta): Observable<OpcionFiltro<string>[]> {
    return this.bloques.regularLento(COD_CAMPANAS.opcionesAsesorMentoring, nodo).pipe(
      map((tabla) => [
        { id: TODO, desc: 'TODO' },
        ...tabla.body.map((fila) => ({ id: String(fila['id'] ?? ''), desc: String(fila['desc'] ?? fila['id'] ?? '') })),
      ]),
    );
  }

  /**
   * "Reporte Mentoring" — legado `RMentoring` (`RMENTORIN_01`, host `cra-v1p7`).
   *
   * El mapa declara un segundo bloque ("Créditos Grupales") pero está comentado.
   *
   * Al `fec` del bloque el legado le suma el asesor elegido (`resp`, del
   * `filterF$` de `report-cra-v1p7.component.ts`) — sin él el backend
   * respondía 500. Va por `regularLento()`: el reporte mueve tanta data que no
   * entraba en los 30 s por defecto ("dale más tiempo de carga").
   */
  mentoring(nodo: NodoConsulta, resp: string = TODO): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regularLento(COD_CAMPANAS.mentoring, nodo, { fec: this.bloques.fec(), resp })
      .pipe(map((tabla1) => ({ tabla1 })));
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
      this.bloques.tablaRegularCon(COD_CAMPANAS.agendamientoBases, { ...base, mode: 1 }),
      this.bloques.tablaRegularCon(COD_CAMPANAS.agendamientoBases, { ...base, mode: 2 }),
      this.bloques.tablaRegularCon(COD_CAMPANAS.agendamientoDetalle, { ...base, mode: 1, nom: filtros.rango }),
      this.bloques.tablaRegularCon(COD_CAMPANAS.agendamientoResumen, { ...base, mode: 1, nom: filtros.rango }),
    ]);
  }
}
