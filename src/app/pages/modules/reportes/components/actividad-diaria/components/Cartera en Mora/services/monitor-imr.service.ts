import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModRep2Service } from '../../../../../../../../core/winder/instances/mod-rep2.service';
import { ShellStateService } from '../../../../../../../../core/services/shell-state.service';
import { fechaCorteCompacta } from '../../../../../utils/fecha-reporte.util';
import type { NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { ColumnaDinamica } from '../../../../../models/tabla-dinamica.model';
import {
  RESULTADO_IMR_VACIO,
  TIPO_DETALLE_IMR,
  type ResultadoImr,
  type TarjetaImr,
} from '../models/cartera-en-mora.model';

/** Forma cruda de `resultado` de `mon_imr.resultados`. */
interface ResultadoImrCrudo {
  cards?: TarjetaImr[];
  table?: Record<string, unknown>[];
  /** Los encabezados vienen como JSON string dentro de la primera fila de `dataHeaders`. */
  dataHeaders?: { Headers?: string }[];
}

/**
 * "Monitor IMR" — legado `repositorio/mon-imr`.
 *
 * Como "Monitor Salidas y Retenciones", es de los pocos reportes que no pasan
 * por el módulo `reporting`: usa el `rep2` del backend (puerto 6304) con sus
 * propios strands `mon_imr.resultados` / `mon_imr.detalle`.
 */
@Injectable({ providedIn: 'root' })
export class MonitorImrService {
  private readonly rep2 = inject(ModRep2Service);
  private readonly shell = inject(ShellStateService);

  /**
   * Tarjetas, tabla y encabezados del nivel elegido.
   *
   * A diferencia de Monitor Salidas, acá las columnas NO están hardcodeadas:
   * el backend las manda como JSON string en `dataHeaders[0].Headers`, y el
   * legado descarta las que vienen ocultas (`cellStyle.display: 'none'`).
   */
  resultados(nodo: NodoConsulta, imp: number): Observable<ResultadoImr> {
    return this.rep2.getMonImrResultados({ ...this.paramsBase(nodo), imp }).pipe(
      map((r) => {
        const resultado = (r.body as { resultado?: ResultadoImrCrudo } | null)?.resultado;
        if (!resultado) return RESULTADO_IMR_VACIO;
        return {
          cards: resultado.cards ?? [],
          table: resultado.table ?? [],
          columnas: this.columnas(resultado.dataHeaders),
        };
      }),
    );
  }

  /**
   * Listado de clientes detrás de una tarjeta o celda.
   *
   * `metrica` es la clave de la tarjeta/columna (`sali1`..`sali5`) y el backend
   * la espera traducida a su `tip` (1 a 5) — legado `lista-clientes.component.ts`.
   */
  detalle(nodo: NodoConsulta, metrica: string, top: number): Observable<Record<string, unknown>[]> {
    const params = { ...this.paramsBase(nodo), tip: TIPO_DETALLE_IMR[metrica] ?? 1, top };
    return this.rep2
      .getMonImrDetalle(params)
      .pipe(map((r) => ((r.body as { resultado?: Record<string, unknown>[] } | null)?.resultado ?? [])));
  }

  /** Encabezados del backend, sin las columnas que el legado deja ocultas. */
  private columnas(dataHeaders: { Headers?: string }[] | undefined): ColumnaDinamica[] {
    const crudo = dataHeaders?.[0]?.Headers;
    if (!crudo) return [];
    const columnas = JSON.parse(crudo) as ColumnaDinamica[];
    return columnas.filter((c) => c.cellStyle?.['display']?.toLowerCase() !== 'none');
  }

  /**
   * `fec` va en `YYYYMMDD` sin guiones, igual que en Monitor Salidas: este
   * reporte pega directo contra `rep2` (`MonImrAntService.getDataSources()` del
   * legado), que manda `profile.curr_fec` tal cual, sin reformatear.
   */
  private paramsBase(nodo: NodoConsulta): Record<string, unknown> {
    return {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      fec: fechaCorteCompacta(this.shell.usuarioActivo()?.fechaCorte),
    };
  }
}

export { RESULTADO_IMR_VACIO };
