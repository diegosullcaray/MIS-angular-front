import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { OpcionFiltro } from '../../../../../models/filtros.model';
import type { ReporteBloqueUnico } from '../../Captaciones/models/captaciones.model';

/**
 * Los seis reportes de "Tablero Digital".
 *
 * Todos declaran `reportType: ReportType.REGULAR` en `cra-map.ts`, pero no se
 * piden igual: lo que cambia es el HOST y el `id` que declara cada entrada.
 *
 * - `TABDIG`, `TABDIG_VR2`, `GCTABDIG_VR2_OPE`, `RVIUWGCOR` y `RVIUWGCORE`
 *   cuelgan de hosts `cra-v1p1`/`cra-v1p4`, que arman
 *   `{ ...getParamsAdd(), ...filter, ...level }`. Como sus tablas declaran
 *   `params: { fec: fec_day_ult }`, eso equivale exactamente a `regular()`.
 * - `RDETCORR` cuelga de `cra-V10`, que es PAGINADO: manda `pagen` y el nodo
 *   COMPLETO. Sin eso el backend responde "Resultado vacio para: regularData".
 * - "Tablero Digital Comercial" no está en `cra-map.ts`: vive en el repositorio
 *   (`RS_TAB_COM_01`, motor `table.regular`) y su corte sale de un selector de
 *   periodo propio (`RS_FECH`), no de la fecha del usuario.
 *
 * OJO con los `id`: "Gestión por Canal" y "Gestión (Corresponsal)" declaran
 * `_02`, no `_01`. Sus entradas del mapa no tienen un `_01` activo.
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
    return this.bloques.regulares([{ codRep: 'TABDIG_01' }, { codRep: 'TABDIG_02' }], nodo);
  }

  /** "Vista General" de Operaciones — legado `tab-digital_vr2-ope` (`TABDIG_VR2_01`, jerarquía `MAC_2`). */
  vistaGeneralCanal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('TABDIG_VR2_01', nodo);
  }

  /** "Gestión por Canal" — legado `GC-tab-digital_vr2-ope` (`GCTABDIG_VR2_OPE_02`, jerarquía `MAC_2`). */
  gestionCanal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('GCTABDIG_VR2_OPE_02', nodo);
  }

  /** "Vista General" de Corresponsal — legado `v-general-cor` (`RVIUWGCOR_01`, jerarquía `OFI_1`). */
  vistaGeneralCorresponsal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('RVIUWGCOR_01', nodo);
  }

  /** "Gestión" de Corresponsal — legado `v-gestion-cor` (`RVIUWGCORE_02`, jerarquía `OFI_1`). */
  gestionCorresponsal(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('RVIUWGCORE_02', nodo);
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
      .regularPaginado('RDETCORR_01', nodo, { fec: this.bloques.fec() }, pagina)
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Las opciones del selector de periodo de "Tablero Digital Comercial" (legado `loadFilter()`). */
  periodosTableroComercial(): Observable<OpcionFiltro[]> {
    return this.bloques.periodos('RS_FECH');
  }

  /**
   * "Tablero Digital Comercial" — legado `repositorio/usabilidad-comercial-m`
   * (`RS_TAB_COM_01`, motor `table.regular`, jerarquía `UNI_1`).
   *
   * El corte es el del selector de periodo (`fechaMensual.val`); si todavía no
   * respondió, el del usuario.
   */
  tableroComercial(nodo: NodoConsulta, fec = this.bloques.fecha()): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegularCon('RS_TAB_COM_01', { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec });
  }

  private unBloque(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }
}
