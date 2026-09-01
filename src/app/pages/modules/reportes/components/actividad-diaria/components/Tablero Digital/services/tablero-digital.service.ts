import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { OpcionFiltro } from '../../../../../models/filtros.model';
import type { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';

/** Servicios para reportes de Tablero Digital. */
@Injectable({ providedIn: 'root' })
export class TableroDigitalService {
  private readonly bloques = inject(BloqueReporteService);

  /** Reporte APP Cliente - Home Banking. */
  appClienteHomeBanking(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares([{ codRep: 'TABDIG_01' }, { codRep: 'TABDIG_02' }], nodo);
  }

  /** Vista General de Operaciones. */
  vistaGeneralCanal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('TABDIG_VR2_01', nodo);
  }

  /** Gestión por Canal. */
  gestionCanal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('GCTABDIG_VR2_OPE_02', nodo);
  }

  /** Vista General de Corresponsal. */
  vistaGeneralCorresponsal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('RVIUWGCOR_01', nodo);
  }

  /** Gestión de Corresponsal. */
  gestionCorresponsal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('RVIUWGCORE_02', nodo);
  }

  /** Detalle de Corresponsales. */
  detalleCorresponsales(nodo: NodoConsulta, pagina = 1): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regularPaginado('RDETCORR_01', nodo, { fec: this.bloques.fec() }, pagina)
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Opciones de periodo para Tablero Comercial. */
  periodosTableroComercial(): Observable<OpcionFiltro[]> {
    return this.bloques.periodos('RS_FECH');
  }

  /** Tablero Digital Comercial. */
  tableroComercial(nodo: NodoConsulta, fec = this.bloques.fecha()): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegularCon('RS_TAB_COM_01', { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec });
  }

  private unBloque(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }
}
