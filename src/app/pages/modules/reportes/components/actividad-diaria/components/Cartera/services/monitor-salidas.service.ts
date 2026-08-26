import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModRep2Service } from '../../../../../../../../core/winder/instances/mod-rep2.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import { fechaCorteCompacta } from '../../../../../utils/fecha-reporte.util';
import type { NodoConsulta } from '../../../../../services/bloque-reporte.service';
import { RESULTADO_SALIDAS_VACIO, TIPO_DETALLE, type ResultadoSalidas } from '../models/monitor-salidas.model';

/**
 * "Monitor Salidas y Retenciones" — legado `repositorio/mon-salidas`.
 *
 * Es el único reporte de Cartera que no vive en el módulo `reporting`: usa el
 * `rep2` del backend (puerto 6304), con sus propios strands.
 */
@Injectable({ providedIn: 'root' })
export class MonitorSalidasService {
  private readonly rep2 = inject(ModRep2Service);
  private readonly shell = inject(ShellStateService);

  /** Tarjetas y tabla del nivel elegido. */
  resultados(nodo: NodoConsulta): Observable<ResultadoSalidas> {
    return this.rep2.getMonSalidasResultados({ ...this.paramsBase(nodo) }).pipe(
      map((r) => {
        const resultado = (r.body as { resultado?: Partial<ResultadoSalidas> } | null)?.resultado;
        return { cards: resultado?.cards ?? [], table: resultado?.table ?? [] };
      }),
    );
  }

  /**
   * Listado de clientes detrás de una métrica.
   *
   * `metrica` es la clave de la columna/tarjeta (`sali1`, `sali3` o `clive`) y
   * el backend la espera traducida a su `tip` (1, 2 o 3).
   */
  detalle(nodo: NodoConsulta, metrica: string, top: number): Observable<Record<string, unknown>[]> {
    const params = { ...this.paramsBase(nodo), tip: TIPO_DETALLE[metrica] ?? 1, top };
    return this.rep2
      .getMonSalidasDetalle(params)
      .pipe(map((r) => ((r.body as { resultado?: Record<string, unknown>[] } | null)?.resultado ?? [])));
  }

  /**
   * `fec` va en `YYYYMMDD` sin guiones — a diferencia del resto de Cartera (que usa el motor
   * "mixto" y `fechaCorte()` con guiones), este reporte pega directo contra `rep2`
   * (`MonSalidasAntService.getDataSources()` del legado), que manda `profile.curr_fec` tal cual,
   * sin reformatear. Pedirlo con guiones es lo que producía el 500: el backend de este módulo
   * no lo reconoce.
   */
  private paramsBase(nodo: NodoConsulta): Record<string, unknown> {
    return { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec: fechaCorteCompacta(this.shell.usuarioActivo()?.fechaCorte) };
  }
}

export { RESULTADO_SALIDAS_VACIO };
