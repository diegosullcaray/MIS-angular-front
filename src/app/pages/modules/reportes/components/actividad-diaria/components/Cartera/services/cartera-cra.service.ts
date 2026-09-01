import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';
import {
  COD_CARTERA_CRA,
  COD_CARTERA_CRA_MULTIBLOQUE,
  VARIABLES_AUTONOMIA_TASAS,
} from '../constantes/cartera.constantes';

/** Servicios de reportes de Cartera. */
@Injectable({ providedIn: 'root' })
export class CarteraCraService {
  private readonly bloques = inject(BloqueReporteService);

  /** Saldo de Cartera. */
  saldoCartera(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.variosConFecha(COD_CARTERA_CRA_MULTIBLOQUE.saldoCartera, nodo);
  }

  /** Datos por Producto. */
  datosProducto(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.variosConFecha(COD_CARTERA_CRA_MULTIBLOQUE.datosProducto, nodo);
  }

  /** Portafolio Agro. */
  portafolioAgro(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_CARTERA_CRA.portafolioAgro, nodo);
  }

  /** Destino de Crédito. */
  destinoCredito(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_CARTERA_CRA.destinoCredito, nodo);
  }

  /** Comité de Créditos Diario. */
  comiteCreditos(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_CARTERA_CRA.comiteCreditos, nodo);
  }

  /** Ranking Autonomías. */
  rankingAutonomias(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_CARTERA_CRA.rankingAutonomias, nodo);
  }

  /** Activas PDM. */
  activasPdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_CARTERA_CRA.activasPdm, nodo);
  }

  /** Mora PDM. */
  moraPdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_CARTERA_CRA.moraPdm, nodo);
  }

  /** Detalle Incentivos PDM. */
  detalleIncentivosPdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regularPaginado(COD_CARTERA_CRA.detalleIncentivosPdm, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Desembolsos PDM. */
  desembolsosPdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regularPaginado(COD_CARTERA_CRA.desembolsosPdm, nodo, { fecha: this.bloques.fec() })
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Desembolsos Diarios. */
  desembolsosDiarios(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      COD_CARTERA_CRA_MULTIBLOQUE.desembolsosDiarios.map((codRep) => ({ codRep })),
      nodo,
    );
  }

  /** Autonomía de Tasas. */
  autonomiaTasas(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fec = this.bloques.fec();
    const bloques = VARIABLES_AUTONOMIA_TASAS.map((v) => ({
      codRep: `GST_ACTIVAS_${String(v).padStart(2, '0')}`,
      extra: { var: v, fec, diario: 1 },
    }));
    return this.bloques.regulares(bloques, nodo);
  }

  private unBloque(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Varios bloques del mismo reporte, todos con el corte como `fecha`. */
  private variosConFecha(codReps: readonly string[], nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fecha = this.bloques.fec();
    return this.bloques.regulares(
      codReps.map((codRep) => ({ codRep, extra: { fecha } })),
      nodo,
    );
  }
}
