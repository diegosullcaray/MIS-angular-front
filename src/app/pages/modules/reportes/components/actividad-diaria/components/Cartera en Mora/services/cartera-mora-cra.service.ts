import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { ReporteBloqueUnico } from '../../Captaciones/models/captaciones.model';

/**
 * Los reportes de "Cartera en Mora" que salen de los hosts `report-cra-*` del
 * legado, con jerarquía `UNI_1` en todos.
 *
 * Dos detalles que NO son intercambiables entre reportes:
 *
 * - **Strand.** Los que declaran `reportType: REGULAR` en `cra-map.ts` van por
 *   `regularData` (`regular()`); los que no lo declaran caen en el
 *   `ReportType.DEPRECATED` por defecto de `report.ts` y van por `reportData`
 *   (`deprecado()`). Los tres monitores de efectividades viven en
 *   `com-map.module.ts` y son de este segundo grupo.
 * - **Nombre del corte.** Unos piden `fec` (lo agrega `BloqueReporteService`) y
 *   otros `fecha`, que hay que pasarle aparte. Mandar el que no es deja el
 *   bloque vacío sin error.
 */
@Injectable({ providedIn: 'root' })
export class CarteraMoraCraService {
  private readonly bloques = inject(BloqueReporteService);

  /** "CMG Cartera en Mora" — legado `cmg-mora` (`cuadro_Variable_Riesgo`). */
  cmgMora(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('cuadro_Variable_Riesgo_01', nodo);
  }

  /** "CMG Cartera en Mora Sin Impulso" — legado `cmg-mora-simp` (`cmg_mora_simp`). */
  cmgMoraSinImpulso(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('cmg_mora_simp_01', nodo);
  }

  /** "Calidad de Cartera" — legado `cal-cart` (`RS_CAL_CAR`), dos bloques que piden `fecha`. */
  calidadCartera(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.variosConFecha('RS_CAL_CAR', ['_01', '_02'], nodo);
  }

  /** "Portafolios y Supervisión" — legado `port-sup` (`PORTSUPE`), dos bloques sin parámetros propios. */
  portafoliosSupervision(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares([{ codRep: 'PORTSUPE_01' }, { codRep: 'PORTSUPE_02' }], nodo);
  }

  /** "Cero y una Cuota" — legado `zu-cuo` (`CEROYCUOTA`), dos bloques sin parámetros propios. */
  ceroUnaCuota(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares([{ codRep: 'CEROYCUOTA_01' }, { codRep: 'CEROYCUOTA_02' }], nodo);
  }

  /**
   * "Monitor Efectividades" — legado `mon-efec` (`RS_MON_EFEC`, host `cra-v4`).
   *
   * Cuatro bloques: el `_01` resumen, el `_02` con sus siete filtros propios y
   * el `_03` dos veces, una por tramo (`-30-0` y `1-30`), que es como el legado
   * arma sus dos "Resumen de Gestiones Ingresadas".
   */
  monitorEfectividades(nodo: NodoConsulta, filtros: Record<string, unknown>): Observable<TablaReporteResultado[]> {
    const fecha = this.bloques.fec();
    return this.deprecados(
      [
        { codRep: 'RS_MON_EFEC_01', extra: { fecha } },
        { codRep: 'RS_MON_EFEC_02', extra: { fecha, ...filtros } },
        { codRep: 'RS_MON_EFEC_03', extra: { fecha, tram: '1. -30-0' } },
        { codRep: 'RS_MON_EFEC_03', extra: { fecha, tram: '2. 1-30' } },
      ],
      nodo,
    );
  }

  /** "Seguimiento Reprogramados" — legado `mon-efecrepro` (`RS_MON_EFECREPRO`, host `cra-v7`). */
  seguimientoReprogramados(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloqueDeprecado('RS_MON_EFECREPRO_01', nodo);
  }

  /** "Reporte de Pago Puntual" — legado `mon-efectramoscomer` (`RS_MON_EFECTRAMOSC`, host `cra-v7`). */
  reportePagoPuntual(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloqueDeprecado('RS_MON_EFECTRAMOSC_01', nodo);
  }

  /**
   * "Efectividades Sin Asignar" — legado `mon-efec-sinasig` (`RMESA`).
   *
   * Va por el host paginado `report-cra-V10`: sin `pagen` ni el nodo completo el
   * backend responde "Resultado vacio para: regularData".
   */
  efectividadesSinAsignar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regularPaginado('RMESA_01', nodo).pipe(map((tabla1) => ({ tabla1 })));
  }

  /**
   * "Top Variables de Riesgos" — legado `top-efec` (`RSRTOPV`).
   *
   * Los tres bloques son el MISMO `cod_rep` y solo cambian por su
   * `tip_cod2`/`level`: grupo, corredores y unidades. Ojo con el `id` del mapa:
   * es `'01'` sin guion bajo, así que el código es `RSRTOPV01`, no `RSRTOPV_01`.
   */
  topVariablesRiesgo(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      [
        { codRep: 'RSRTOPV01', extra: { tip_cod2: '7', level: '2' } },
        { codRep: 'RSRTOPV01', extra: { tip_cod2: '20', level: '1' } },
        { codRep: 'RSRTOPV01', extra: { tip_cod2: '18', level: '1' } },
      ],
      nodo,
    );
  }

  /**
   * "Seguimiento de Portafolio" — legado `ava-port` (`RS_AVA_POR`).
   *
   * Igual que el anterior: un solo bloque `_01` pedido tres veces, distinguido
   * por su `mode` (1 potencial ingreso a mora, 2 por grupo, 3 cuota ballon).
   */
  seguimientoPortafolio(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fecha = this.bloques.fec();
    return this.bloques.regulares(
      [1, 2, 3].map((mode) => ({ codRep: 'RS_AVA_POR_01', extra: { fecha, mode } })),
      nodo,
    );
  }

  private unBloque(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }

  private unBloqueDeprecado(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques
      .deprecado(codRep, nodo, { fecha: this.bloques.fec() })
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  private variosConFecha(modulo: string, ids: string[], nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fecha = this.bloques.fec();
    return this.bloques.regulares(
      ids.map((id) => ({ codRep: `${modulo}${id}`, extra: { fecha } })),
      nodo,
    );
  }

  /** `forkJoin` de bloques del strand deprecado — el equivalente de `regulares()` para `reportData`. */
  private deprecados(
    bloques: readonly { codRep: string; extra: Record<string, unknown> }[],
    nodo: NodoConsulta,
  ): Observable<TablaReporteResultado[]> {
    return forkJoin(bloques.map((b) => this.bloques.deprecado(b.codRep, nodo, b.extra)));
  }
}
