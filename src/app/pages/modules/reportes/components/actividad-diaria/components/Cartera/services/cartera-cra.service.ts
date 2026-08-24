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

  /** "Detalle Incentivos PDM" — legado `res-inc_pdm` (`RESINCGRUP`), sin parámetros propios. */
  detalleIncentivosPdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('RESINCGRUP_01', nodo);
  }

  /** "Desembolsos PDM" — legado `det-ince-pdm` (`DET_INCEN_PDM`), que pide `fecha`. */
  desembolsosPdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regular('DET_INCEN_PDM_01', nodo, { fecha: this.bloques.fec() })
      .pipe(map((tabla1) => ({ tabla1 })));
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
