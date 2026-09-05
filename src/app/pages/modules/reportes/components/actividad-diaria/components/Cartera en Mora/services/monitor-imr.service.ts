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

/** Forma cruda del resultado IMR. */
interface ResultadoImrCrudo {
  cards?: TarjetaImr[];
  table?: Record<string, unknown>[];
  /** Los encabezados vienen como JSON string dentro de la primera fila de `dataHeaders`. */
  dataHeaders?: { Headers?: string }[];
}

/** Servicio de Monitor IMR. */
@Injectable({ providedIn: 'root' })
export class MonitorImrService {
  private readonly rep2 = inject(ModRep2Service);
  private readonly shell = inject(ShellStateService);

  /** Resultados del nivel elegido. */
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

  /** Listado de clientes. */
  detalle(nodo: NodoConsulta, metrica: string, top: number): Observable<Record<string, unknown>[]> {
    const params = { ...this.paramsBase(nodo), tip: TIPO_DETALLE_IMR[metrica] ?? 1, top };
    return this.rep2
      .getMonImrDetalle(params)
      .pipe(map((r) => ((r.body as { resultado?: Record<string, unknown>[] } | null)?.resultado ?? [])));
  }

  /** Extrae encabezados activos. */
  private columnas(dataHeaders: { Headers?: string }[] | undefined): ColumnaDinamica[] {
    const crudo = dataHeaders?.[0]?.Headers;
    if (!crudo) return [];
    const columnas = JSON.parse(crudo) as ColumnaDinamica[];
    return columnas.filter((c) => c.cellStyle?.['display']?.toLowerCase() !== 'none');
  }

  /** Parámetros base para la consulta. */
  private paramsBase(nodo: NodoConsulta): Record<string, unknown> {
    return {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      fec: fechaCorteCompacta(this.shell.usuarioActivo()?.fechaCorte),
    };
  }
}

export { RESULTADO_IMR_VACIO };
