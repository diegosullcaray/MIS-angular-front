import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { OpcionFiltro } from '../../../../../models/filtros.model';
import type { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';
import { COD_TABLERO_DIGITAL } from '../constantes/tablero-digital.constantes';

/** Servicios para reportes de Tablero Digital. */
@Injectable({ providedIn: 'root' })
export class TableroDigitalService {
  private readonly bloques = inject(BloqueReporteService);

  /** Reporte APP Cliente - Home Banking. */
  appClienteHomeBanking(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      COD_TABLERO_DIGITAL.appClienteHomeBanking.map((codRep) => ({ codRep })),
      nodo,
    );
  }

  /** Vista General de Operaciones. */
  vistaGeneralCanal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_TABLERO_DIGITAL.vistaGeneralCanal, nodo);
  }

  /** Gestión por Canal. */
  gestionCanal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_TABLERO_DIGITAL.gestionCanal, nodo);
  }

  /** Vista General de Corresponsal. */
  vistaGeneralCorresponsal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_TABLERO_DIGITAL.vistaGeneralCorresponsal, nodo);
  }

  /** Gestión de Corresponsal. */
  gestionCorresponsal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_TABLERO_DIGITAL.gestionCorresponsal, nodo);
  }

  /** Detalle de Corresponsales. */
  detalleCorresponsales(nodo: NodoConsulta, pagina = 1): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regularPaginado(COD_TABLERO_DIGITAL.detalleCorresponsales, nodo, { fec: this.bloques.fec() }, pagina)
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Opciones de periodo para Tablero Comercial. */
  periodosTableroComercial(): Observable<OpcionFiltro[]> {
    return this.bloques.periodos(COD_TABLERO_DIGITAL.periodosTableroComercial);
  }

  /** Tablero Digital Comercial. */
  tableroComercial(nodo: NodoConsulta, fec = this.bloques.fecha()): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegularCon(COD_TABLERO_DIGITAL.tableroComercial, { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec });
  }

  private unBloque(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }
}
