import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import { derivadosDeFilaTotal, type BancaSolidariaResultado } from '../models/banca-solidaria.model';
import type { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';
import { COD_REPORTES_PDM } from '../constantes/reportes-pdm.constantes';

/**
 * Los dos reportes de "Reportes PDM", que no comparten motor:
 *
 * - "Seguimiento PDM" sale del host `cra-v1p1` → motor "mixto" (`regularData`).
 * - "Gestión de Banca Solidaria" vive en el repositorio → motor `table.regular`,
 *   con columnas dinámicas y `fec` CON GUIONES (`YYYY-MM-DD`), que es lo que
 *   manda `banca-solidaria.component.ts` del legado.
 */
@Injectable({ providedIn: 'root' })
export class ReportesPdmService {
  private readonly bloques = inject(BloqueReporteService);

  /** "Seguimiento PDM" — legado `seg_pdm` (`SEG_PDM_01`). */
  seguimientoPdm(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(COD_REPORTES_PDM.seguimientoPdm, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }

  /**
   * "Gestión de Banca Solidaria" — legado `repositorio/banca-solidaria`
   * (`GRBSOLI_01`).
   *
   * Ojo con el nombre del parámetro: este bloque pide `fec`, pero con el formato
   * con guiones de `fecha()` — no es el `fec` compacto del motor mixto.
   *
   * Las tarjetas y las dos gráficas NO son bloques aparte: el legado las saca de
   * la primera fila de esta misma tabla, la de totales.
   */
  bancaSolidaria(nodo: NodoConsulta): Observable<BancaSolidariaResultado> {
    return this.bloques
      .tablaRegularCon(COD_REPORTES_PDM.bancaSolidaria, {
        tip_cod: nodo.tip_cod,
        cod_rel: nodo.cod_rel,
        fec: this.bloques.fecha(),
      })
      .pipe(map((tabla) => ({ tabla, ...derivadosDeFilaTotal(tabla.filas) })));
  }
}
