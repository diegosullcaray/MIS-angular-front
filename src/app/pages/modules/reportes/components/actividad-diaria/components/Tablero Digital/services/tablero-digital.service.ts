import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';
import { COD_TABLERO_DIGITAL } from '../constantes/tablero-digital.constantes';
import { COLUMNAS_TABLERO_COMERCIAL } from '../models/tablero-comercial.model';
import { semaforosTableroComercial } from '../utils/tablero-comercial.util';

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

  /** Vista General de Corresponsal. */
  vistaGeneralCorresponsal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_TABLERO_DIGITAL.vistaGeneralCorresponsal, nodo);
  }

  /** Gestión de Corresponsal. */
  gestionCorresponsal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_TABLERO_DIGITAL.gestionCorresponsal, nodo);
  }

  /**
   * Tablero Digital Comercial diario — legado `repositorio/usabilidad_comercial/usa_come`.
   *
   * Igual que el legado: `RS_TAB_COM_01` con la fecha de corte del usuario, y las columnas son
   * las del `tblHeaders` estático del legado, no los `headers` de la respuesta (el backend no los
   * manda para este reporte, y por eso la tabla quedaba sin columnas y no se veía).
   */
  tableroComercial(nodo: NodoConsulta): Observable<TablaDinamicaResultado> {
    return this.bloques
      .tablaRegularCon(COD_TABLERO_DIGITAL.tableroComercial, { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec: this.bloques.fecha() })
      .pipe(map((tabla) => ({ columnas: COLUMNAS_TABLERO_COMERCIAL, filas: semaforosTableroComercial(tabla.filas) })));
  }

  private unBloque(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }
}
