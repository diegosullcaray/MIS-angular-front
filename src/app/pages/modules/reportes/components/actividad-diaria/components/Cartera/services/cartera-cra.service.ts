import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { ReporteBloqueUnico } from '../../../models/captaciones.model';

/**
 * Los reportes de Cartera que salen del `report-cra-v1p1` del legado: motor
 * "mixto", jerarquía `UNI_1` y, salvo Comité de Créditos, un `fec`/`fecha` de corte.
 *
 * Ojo con ese par: cada entrada de `cra-map.ts` declara el suyo y no son
 * intercambiables. Los que piden `fecha` lo reciben aparte, porque
 * `BloqueReporteService` solo agrega `fec` por su cuenta.
 */
@Injectable({ providedIn: 'root' })
export class CarteraCraService {
  private readonly bloques = inject(BloqueReporteService);

  /** "Saldo Cartera" — legado `saldo` (`RS_SAL_CAR`). Sus 5 bloques, en el orden del legado. */
  saldoCartera(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.variosConFecha('RS_SAL_CAR', ['_04', '_05', '_01', '_02', '_03'], nodo);
  }

  /** "Datos por Producto" — legado `dat-prod` (`RS_DAT_PRO`). */
  datosProducto(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.variosConFecha('RS_DAT_PRO', ['_01', '_02', '_03', '_04'], nodo);
  }

  /** "Portafolio Agro" — legado `port-agro` (`PortafolioAgro`), sin parámetros propios. */
  portafolioAgro(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('PortafolioAgro_01', nodo);
  }

  /** "Destino de Crédito" — legado `des-cred` (`DESCRED`). */
  destinoCredito(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('DESCRED_01', nodo);
  }

  /** "Comité de Créditos Diario" — legado `com-dia` (`GCOMCRE`). Su único bloque es el `_02`. */
  comiteCreditos(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('GCOMCRE_02', nodo);
  }

  /** "Ranking Autonomías" — legado `ranking-diar` (`reporte_autonomia_newdiaria`); su filtro está comentado en el legado. */
  rankingAutonomias(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('reporte_autonomia_newdiaria_01', nodo);
  }

  /** "Activas PDM" — legado `act-pdm` (`RACTGP`). */
  activasPdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('RACTGP_01', nodo);
  }

  /** "Mora PDM" — legado `mora-pdm` (`RESMORAGP`). */
  moraPdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('RESMORAGP_01', nodo);
  }

  /**
   * "Detalle Incentivos PDM" — legado `res-inc_pdm` (`RESINCGRUP`), sin
   * parámetros propios. Va por el host paginado `report-cra-V10`.
   */
  detalleIncentivosPdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regularPaginado('RESINCGRUP_01', nodo).pipe(map((tabla1) => ({ tabla1 })));
  }

  /**
   * "Desembolsos PDM" — legado `det-ince-pdm` (`DET_INCEN_PDM`), que pide `fecha`.
   *
   * También es del host paginado `report-cra-V10`: sin `pagen` ni el nodo
   * completo el backend contesta "Resultado vacio para: regularData".
   */
  desembolsosPdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regularPaginado('DET_INCEN_PDM_01', nodo, { fecha: this.bloques.fec() })
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  /** "Desembolsos Diarios" — legado `desem-dia` (`DesemDiario`), 5 bloques sin parámetros propios. */
  desembolsosDiarios(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      ['_01', '_02', '_03', '_04', '_05'].map((id) => ({ codRep: `DesemDiario${id}` })),
      nodo,
    );
  }

  /**
   * "Autonomía de Tasas" — legado `aut-tasa` (`GST_ACTIVAS`).
   *
   * Cada bloque se distingue solo por su `var`, y el orden del array del legado
   * es `_01`.._08, `_10`, `_09` — el `_10` va antes que el `_09`, y las
   * pestañas del host indexan sobre ese orden.
   */
  autonomiaTasas(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fec = this.bloques.fec();
    const bloques = [1, 2, 3, 4, 5, 6, 7, 8, 10, 9].map((v) => ({
      codRep: `GST_ACTIVAS_${String(v).padStart(2, '0')}`,
      extra: { var: v, fec, diario: 1 },
    }));
    return this.bloques.regulares(bloques, nodo);
  }

  private unBloque(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }

  private variosConFecha(modulo: string, ids: string[], nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fecha = this.bloques.fec();
    return this.bloques.regulares(
      ids.map((id) => ({ codRep: `${modulo}${id}`, extra: { fecha } })),
      nodo,
    );
  }
}
