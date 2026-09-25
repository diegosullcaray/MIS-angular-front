import { Injectable, inject } from '@angular/core';
import { Observable, map, merge, scan } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { OpcionFiltro } from '../../../../../models/filtros.model';
import type { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';
import { TODO } from '../../Portafolio Reasignado/models/portafolio-reasignado.model';
import { COD_CAMPANAS } from '../constantes/campanas.constantes';

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
      .regular(COD_CAMPANAS.apadrinamiento, nodo, { fecha: this.bloques.fec() })
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Opciones de Asesor para Mentoring. */
  opcionesAsesorMentoring(nodo: NodoConsulta): Observable<OpcionFiltro<string>[]> {
    return this.bloques.regularLento(COD_CAMPANAS.opcionesAsesorMentoring, nodo).pipe(
      map((tabla) => [
        { id: TODO, desc: 'TODO' },
        ...tabla.body.map((fila) => ({ id: String(fila['id'] ?? ''), desc: String(fila['desc'] ?? fila['id'] ?? '') })),
      ]),
    );
  }

  /** Reporte de Mentoring. */
  mentoring(nodo: NodoConsulta, resp: string = TODO): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regularLento(COD_CAMPANAS.mentoring, nodo, { fec: this.bloques.fec(), resp })
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  /**
   * Reporte de Agendamiento: las cuatro tablas del legado, **con carga independiente**. Emite el
   * arreglo cada vez que responde una, con `null` en las que todavía esperan, para que una tabla
   * lenta (los "Detalle" traen miles de filas) no retenga a las demás.
   */
  agendamiento(nodo: NodoConsulta, filtros: FiltrosAgenda): Observable<(TablaDinamicaResultado | null)[]> {
    const base = {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      fecha: this.bloques.fecha(),
      fuga: filtros.fuga,
      prop: filtros.prop,
    };
    const consultas = [
      this.bloques.tablaRegularCon(COD_CAMPANAS.agendamientoBases, { ...base, mode: 1 }),
      this.bloques.tablaRegularCon(COD_CAMPANAS.agendamientoBases, { ...base, mode: 2 }),
      this.bloques.tablaRegularCon(COD_CAMPANAS.agendamientoDetalle, { ...base, mode: 1, nom: filtros.rango }),
      this.bloques.tablaRegularCon(COD_CAMPANAS.agendamientoResumen, { ...base, mode: 1, nom: filtros.rango }),
    ];
    return merge(...consultas.map((consulta$, i) => consulta$.pipe(map((tabla) => ({ i, tabla }))))).pipe(
      scan(
        (tablas: (TablaDinamicaResultado | null)[], { i, tabla }) => tablas.map((t, j) => (j === i ? tabla : t)),
        consultas.map(() => null),
      ),
    );
  }
}
