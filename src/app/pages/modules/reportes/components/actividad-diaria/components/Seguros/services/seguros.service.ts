import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { BloqueGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import type { IWinderResponse } from '../../../../../../../../core/winder/winder/winder.interface';
import type { OpcionFiltro } from '../../../../../../../../shared/ui/formularios/opcion-filtro.model';

/** Servicios para los reportes de Seguros. */
@Injectable({ providedIn: 'root' })
export class SegurosService {
  private readonly bloques = inject(BloqueReporteService);
  private readonly reportes = inject(ModReportesService);

  /** Reporte de Seguros. */
  reporteSeguros(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      ['_01', '_02', '_04', '_05'].map((id) => ({ codRep: `GRSCMIS${id}` })),
      nodo,
    );
  }

  /** Reporte de Seguros Pasivos. */
  segurosPasivos(nodo: NodoConsulta): Observable<TablaDinamicaResultado[]> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec: this.bloques.fecha() };
    return forkJoin(
      ['_03', '_01', '_02', '_04'].map((id) => this.bloques.tablaRegularCon(`RS_SEG_PAS${id}`, params)),
    );
  }

  /** Opciones del selector de periodo para Seguros Optativos. */
  periodosSegurosOptativos(): Observable<OpcionFiltro[]> {
    return this.bloques.periodos('RS_FECH');
  }

  /** Reporte de Seguros Optativos. */
  segurosOptativos(nodo: NodoConsulta, fec = this.bloques.fecha()): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegularCon('GRSCMISREP_01', {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      fec,
    });
  }

  /** Gráficos evolutivos de Seguros Pasivos. */
  evolutivoPasivos(nodo: NodoConsulta): Observable<BloqueGrafico[]> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec: this.bloques.fecha() };
    return forkJoin([
      this.reportes.getRegularData('GRAFSEGPAS_01', params),
      this.reportes.getRegularData('GRAFSEGPAS_02', params),
    ]).pipe(
      map(([r1, r2]) => [
        graficoDe(r1, 'Microseguro Oncológico', 'Nro. Pólizas'),
        graficoDe(r2, 'Evolutivo de Seguros Pasivos', 'Nro. Pólizas'),
      ].filter((g): g is BloqueGrafico => g !== null)),
    );
  }
}

/** Forma cruda del bloque: `result.body[0]` con `categories` y `series` serializados. */
interface BloqueGraficoSerializado {
  categories?: string;
  series?: string;
}

/** Convierte el payload del gráfico al formato del componente. */
function graficoDe(r: IWinderResponse, titulo: string, tituloEjeY: string): BloqueGrafico | null {
  const cuerpo = (r.body as { result?: { body?: BloqueGraficoSerializado[] } } | null)?.result?.body?.[0];
  if (!cuerpo?.categories || !cuerpo.series) return null;

  try {
    const categorias = JSON.parse(cuerpo.categories) as string[];
    const series = JSON.parse(cuerpo.series) as { name?: string; data?: (number | null)[]; color?: string }[];
    return {
      titulo,
      tituloEjeY,
      categorias: categorias.map((c) => String(c)),
      series: series.map((s) => ({ nombre: s.name ?? '', datos: s.data ?? [], color: s.color })),
    };
  } catch {
    return null;
  }
}
