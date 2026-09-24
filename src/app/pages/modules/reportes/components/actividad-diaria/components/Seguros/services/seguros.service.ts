import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import { COD_SEGUROS } from '../constantes/seguros.constantes';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { OpcionFiltro } from '../../../../../../../../shared/ui/formularios/opcion-filtro.model';

/**
 * Los tres reportes de Seguros. Solo el primero sale del motor "mixto"; los
 * otros dos viven en el repositorio y cada uno usa un motor distinto, así que
 * no comparten helper. Los códigos están en `constantes/`.
 */
@Injectable({ providedIn: 'root' })
export class SegurosService {
  private readonly bloques = inject(BloqueReporteService);

  /** Reporte Seguros. */
  reporteSeguros(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      COD_SEGUROS.reporteSeguros.map((codRep) => ({ codRep })),
      nodo,
    );
  }

  /** Seguros Pasivos. */
  segurosPasivos(nodo: NodoConsulta): Observable<TablaDinamicaResultado[]> {
    const params = this.paramsConFecha(nodo);
    return forkJoin(COD_SEGUROS.segurosPasivos.map((codRep) => this.bloques.tablaRegularCon(codRep, params)));
  }

  /** Opciones del selector de periodo de Seguros Optativos. */
  periodosSegurosOptativos(): Observable<OpcionFiltro[]> {
    return this.bloques.periodos(COD_SEGUROS.periodosSegurosOptativos);
  }

  /**
   * Reporte Seguros Optativos. La `fec` es la del selector de periodo; si no
   * llega, la de corte del usuario, que es con la que abre el legado.
   */
  segurosOptativos(nodo: NodoConsulta, fec = this.bloques.fecha()): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegularCon(COD_SEGUROS.segurosOptativos, { ...this.paramsNodo(nodo), fec });
  }

  private paramsNodo(nodo: NodoConsulta): Record<string, unknown> {
    return { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel };
  }

  private paramsConFecha(nodo: NodoConsulta): Record<string, unknown> {
    return { ...this.paramsNodo(nodo), fec: this.bloques.fecha() };
  }
}
