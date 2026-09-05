import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../services/bloque-reporte.service';
import { ModReportesService } from '../../../../../../core/winder/instances/mod-reportes.service';
import { filasDeResultado, resultadoCrudo, tablaDeResultado } from '../../../utils/reportes-mapeo.util';
import { COD_MENSUAL_REPO } from '../constantes/actividad-mensual.constantes';
import { aplicarEstilosEstructuraDesembolsos } from '../utils/estructura-desembolsos.util';
import { seriesDeGraficoConColor, tarjetasCmgCarteraMensual } from '../utils/actividad-mensual-mapeo.util';
import {
  columnasVisibles,
  conColumnasSemaforo,
  totalesAgro,
} from '../../actividad-diaria/components/Cartera/utils/cartera-mapeo.util';
import { GRAFICOS_AGRICOLA } from '../../actividad-diaria/components/Cartera/models/cartera-agricola.model';
import type { TablaDinamicaResultado, TablaRegularResultadoRaw } from '../../../models/tabla-dinamica.model';
import type { CmgCarteraResultado } from '../../actividad-diaria/components/Cartera/models/cmg-cartera.model';
import type {
  CarteraAgricolaResultado,
  DetalleAgricolaResultado,
} from '../../actividad-diaria/components/Cartera/models/cartera-agricola.model';
import type { OpcionFiltro } from '../../../../../../shared/ui/formularios/opcion-filtro.model';

/**
 * Los reportes mensuales del `repositorio` del legado (motor `table.regular`).
 *
 * Solo arma peticiones: los `cod_rep` están en `constantes/` y el mapeo de cada
 * payload en `utils/`. Varios comparten reporte con la versión diaria, y por eso
 * reutilizan el mapeo de Cartera en vez de duplicarlo.
 */
@Injectable({ providedIn: 'root' })
export class ActividadMensualRepoService {
  private readonly bloques = inject(BloqueReporteService);
  private readonly reportes = inject(ModReportesService);

  /** Opciones del filtro de cierre mensual. */
  periodos(codRep: string = COD_MENSUAL_REPO.periodos): Observable<OpcionFiltro[]> {
    return this.bloques.periodos(codRep);
  }

  /** Tablero Digital Comercial. */
  tableroDigitalComercial(nodo: NodoConsulta, fecha?: string): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegularCon(COD_MENSUAL_REPO.tableroDigitalComercial, this.paramsConFecha(nodo, fecha));
  }

  /** Estructura de Desembolsos mensual, con su coloración condicional. */
  estructuraDesembolsosMensual(nodo: NodoConsulta, fec: string): Observable<TablaDinamicaResultado> {
    return this.bloques
      .tablaRegularCon(COD_MENSUAL_REPO.estructuraDesembolsos, this.paramsConFecha(nodo, fec))
      .pipe(map(aplicarEstilosEstructuraDesembolsos));
  }

  /** Cartera Agrícola · Cultivos. Las tarjetas del mes anterior salen de `meta1[0]`. */
  carteraAgricola(nodo: NodoConsulta, fecha?: string): Observable<CarteraAgricolaResultado> {
    return this.reportes
      .getRegularTableResult(COD_MENSUAL_REPO.carteraAgricola, this.paramsConFecha(nodo, fecha))
      .pipe(
        map((r) => {
          const resultado = resultadoCrudo(r);
          const meta = parseMeta(resultado);
          return {
            tabla: tablaDeResultado(resultado),
            totales: totalesAgro(filasDeResultado(resultado)[0] ?? {}, meta?.[0] ?? {}),
          };
        }),
      );
  }

  /** Los cuatro gráficos del detalle por cultivo. */
  detalleGraficosAgricola(nodo: NodoConsulta, fecha?: string): Observable<DetalleAgricolaResultado> {
    const params = this.paramsConFecha(nodo, fecha);
    const bloques = GRAFICOS_AGRICOLA.map((g) => this.reportes.getRegularTableResult(g.codRep, params));

    return forkJoin(bloques).pipe(
      map((respuestas) => {
        const filasPorGrafico: Record<string, Record<string, unknown>[]> = {};
        const graficos = respuestas.map((r, i) => {
          const { titulo, id } = GRAFICOS_AGRICOLA[i];
          const resultado = resultadoCrudo(r);
          if (id) filasPorGrafico[id] = filasDeResultado(resultado);
          return { titulo, ...seriesDeGraficoConColor(resultado?.headers) };
        });
        return { graficos, filasPorGrafico };
      }),
    );
  }

  /**
   * CMG Cartera. Las dos consultas usan nombres de parámetro distintos entre sí
   * (`codrel`/`Fecha` una, `cod_rel`/`fec` la otra): así los espera el backend.
   */
  cmgCartera(nodo: NodoConsulta, fase: number, fecha?: string): Observable<CmgCarteraResultado> {
    const fecCorte = fecha || this.bloques.fecha();
    const tabla$ = this.reportes.getRegularTableResult(COD_MENSUAL_REPO.cmgCarteraTabla, {
      codrel: nodo.cod_rel,
      Fecha: fecCorte,
      tipcod: nodo.tip_cod,
      met: '1',
      prod: fase,
    });
    const kpis$ = this.reportes.getRegularTableResult(COD_MENSUAL_REPO.cmgCarteraKpis, {
      tipcod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      tipmet: '1',
      prod: fase,
      fec: fecCorte,
    });

    return forkJoin([tabla$, kpis$]).pipe(
      map(([respTabla, respKpis]) => {
        const rTabla = resultadoCrudo(respTabla);
        const filas = filasDeResultado(rTabla);
        const kpis = filasDeResultado(resultadoCrudo(respKpis))[0] ?? {};
        return {
          tabla: { columnas: conColumnasSemaforo(columnasVisibles(rTabla?.headers)), filas },
          tarjetas: tarjetasCmgCarteraMensual(filas, kpis),
        };
      }),
    );
  }

  private paramsConFecha(nodo: NodoConsulta, fecha?: string): Record<string, unknown> {
    return { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec: fecha || this.bloques.fecha() };
  }
}

/** `meta1` llega serializado en unos bloques y ya parseado en otros. */
function parseMeta(resultado: TablaRegularResultadoRaw | undefined): Record<string, unknown>[] | undefined {
  const meta = resultado?.meta1;
  return (typeof meta === 'string' ? JSON.parse(meta) : meta) as Record<string, unknown>[] | undefined;
}
