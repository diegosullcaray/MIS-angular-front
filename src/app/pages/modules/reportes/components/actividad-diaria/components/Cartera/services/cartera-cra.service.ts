import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';

/** Servicios de reportes de Cartera. */
@Injectable({ providedIn: 'root' })
export class CarteraCraService {
  private readonly bloques = inject(BloqueReporteService);

  /** Saldo de Cartera. */
  saldoCartera(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.variosConFecha('RS_SAL_CAR', ['_04', '_05', '_01', '_02', '_03'], nodo);
  }

  /** Datos por Producto. */
  datosProducto(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.variosConFecha('RS_DAT_PRO', ['_01', '_02', '_03', '_04'], nodo);
  }

  /** Portafolio Agro. */
  portafolioAgro(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('PortafolioAgro_01', nodo);
  }

  /** Destino de Crédito. */
  destinoCredito(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('DESCRED_01', nodo);
  }

  /** Comité de Créditos Diario. */
  comiteCreditos(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('GCOMCRE_02', nodo);
  }

  /** Ranking Autonomías. */
  rankingAutonomias(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('reporte_autonomia_newdiaria_01', nodo);
  }

  /** Activas PDM. */
  activasPdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('RACTGP_01', nodo);
  }

  /** Mora PDM. */
  moraPdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('RESMORAGP_01', nodo);
  }

  /** Detalle Incentivos PDM. */
  detalleIncentivosPdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regularPaginado('RESINCGRUP_01', nodo).pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Desembolsos PDM. */
  desembolsosPdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regularPaginado('DET_INCEN_PDM_01', nodo, { fecha: this.bloques.fec() })
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Desembolsos Diarios. */
  desembolsosDiarios(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      ['_01', '_02', '_03', '_04', '_05'].map((id) => ({ codRep: `DesemDiario${id}` })),
      nodo,
    );
  }

  /** Autonomía de Tasas. */
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
