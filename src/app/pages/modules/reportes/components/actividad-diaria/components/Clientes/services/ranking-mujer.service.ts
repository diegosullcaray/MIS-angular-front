import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import { COD_CLIENTES } from '../constantes/clientes.constantes';

/**
 * "Ranking Mujer" — legado `repositorio/ranking-mujer`: motor `table.regular`,
 * jerarquía `UNI_1` y dos tablas, una por pestaña.
 *
 * El legado también pide `RS_AGE_COM_02`/`_03`, pero su plantilla nunca los
 * pinta (quedaron de un copiar/pegar de Agenda Comercial), así que no se migran.
 *
 * Ojo con los parámetros: acá el motor los espera como `tip_cod`/`cod_rel`/`fec`,
 * no como los `tipcod`/`codrel`/`fecha` de Carterización.
 */
@Injectable({ providedIn: 'root' })
export class RankingMujerService {
  private readonly bloques = inject(BloqueReporteService);

  obtener(nodo: NodoConsulta): Observable<[TablaDinamicaResultado, TablaDinamicaResultado]> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec: this.bloques.fecha() };
    const [resumen, detalle] = COD_CLIENTES.rankingMujer;
    return forkJoin([
      this.bloques.tablaRegularCon(resumen, params),
      this.bloques.tablaRegularCon(detalle, params),
    ]);
  }
}
