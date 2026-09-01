import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { OpcionFiltro } from '../../../../../models/filtros.model';
import type { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';
import { COD_TABLERO_DIGITAL } from '../constantes/tablero-digital.constantes';

/**
 * Los seis reportes de Tablero Digital. Todos son `REGULAR`, pero no se piden
 * igual: cuatro cuelgan de hosts `cra-v1p1`/`v1p4` y equivalen a `regular()`;
 * el detalle de corresponsales va por el host paginado; y el Tablero Comercial
 * no está en `cra-map.ts` sino en el repositorio, con su propio selector de
 * periodo. Los códigos están en `constantes/`.
 */
@Injectable({ providedIn: 'root' })
export class TableroDigitalService {
  private readonly bloques = inject(BloqueReporteService);

  /**
   * "APP Cliente - Home Banking" — legado `tab-digital` (`TABDIG`, host
   * `cra-v1p4`, jerarquía `OFI_1`).
   *
   * Es el único de dos bloques: el host pinta `_01` y `_02`. Los pide por vías
   * distintas (`getMixData` y `getRegularData`), pero como el `reportType` del
   * mapa es `REGULAR`, las dos terminan en el mismo strand.
   */
  appClienteHomeBanking(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      COD_TABLERO_DIGITAL.appClienteHomeBanking.map((codRep) => ({ codRep })),
      nodo,
    );
  }

  /** "Vista General" de Operaciones — legado `tab-digital_vr2-ope` (`TABDIG_VR2_01`, jerarquía `MAC_2`). */
  vistaGeneralCanal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_TABLERO_DIGITAL.vistaGeneralCanal, nodo);
  }

  /** "Gestión por Canal" — legado `GC-tab-digital_vr2-ope` (`GCTABDIG_VR2_OPE_02`, jerarquía `MAC_2`). */
  gestionCanal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_TABLERO_DIGITAL.gestionCanal, nodo);
  }

  /** "Vista General" de Corresponsal — legado `v-general-cor` (`RVIUWGCOR_01`, jerarquía `OFI_1`). */
  vistaGeneralCorresponsal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_TABLERO_DIGITAL.vistaGeneralCorresponsal, nodo);
  }

  /** "Gestión" de Corresponsal — legado `v-gestion-cor` (`RVIUWGCORE_02`, jerarquía `OFI_1`). */
  gestionCorresponsal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_TABLERO_DIGITAL.gestionCorresponsal, nodo);
  }

  /**
   * "Detalle Corresponsales" — legado `det_correspon` (`RDETCORR_01`, host
   * `cra-V10`, jerarquía `OFI_1`).
   *
   * Paginado: `pagen` más el nodo completo, y encima el `fec` que declara su
   * tabla en el mapa.
   */
  detalleCorresponsales(nodo: NodoConsulta, pagina = 1): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regularPaginado(COD_TABLERO_DIGITAL.detalleCorresponsales, nodo, { fec: this.bloques.fec() }, pagina)
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Las opciones del selector de periodo de "Tablero Digital Comercial" (legado `loadFilter()`). */
  periodosTableroComercial(): Observable<OpcionFiltro[]> {
    return this.bloques.periodos(COD_TABLERO_DIGITAL.periodosTableroComercial);
  }

  /**
   * "Tablero Digital Comercial" — legado `repositorio/usabilidad-comercial-m`
   * (`RS_TAB_COM_01`, motor `table.regular`, jerarquía `UNI_1`).
   *
   * El corte es el del selector de periodo (`fechaMensual.val`); si todavía no
   * respondió, el del usuario.
   */
  tableroComercial(nodo: NodoConsulta, fec = this.bloques.fecha()): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegularCon(COD_TABLERO_DIGITAL.tableroComercial, { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec });
  }

  private unBloque(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }
}
