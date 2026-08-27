import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import { ModReportesService } from '../../../../../../../../core/winder/instances/mod-reportes.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { BloqueGrafico } from '../../../../../../../../shared/ui/graficos/models/grafico-comun.model';
import type { IWinderResponse } from '../../../../../../../../core/winder/winder/winder.interface';
import type { OpcionFiltro } from '../../../../../../../../shared/ui/formularios/opcion-filtro.model';

/**
 * Los cuatro reportes de "Seguros".
 *
 * Solo el primero sale del motor "mixto"; los otros tres viven en el
 * repositorio y cada uno usa un motor distinto, así que no comparten helper:
 *
 * - "Reporte Seguros" → `regularData` (host `cra-v1p6`).
 * - "Seguros Pasivos" y "Seguros Optativos" → `table.regular`, con el corte
 *   como `fec` pero en formato CON GUIONES (`fecha()`), que es lo que mandan
 *   sus componentes del legado.
 * - "Evolutivo Pasivos" → `regularData`, pero con bloques de gráfico.
 */
@Injectable({ providedIn: 'root' })
export class SegurosService {
  private readonly bloques = inject(BloqueReporteService);
  private readonly reportes = inject(ModReportesService);

  /**
   * "Reporte Seguros" — legado `cam-seguros` (`GRSCMIS`, host `cra-v1p6`).
   *
   * Sus ids no son correlativos: el mapa declara `_01`, `_02`, `_04` y `_05`
   * (el `_03` está comentado).
   */
  reporteSeguros(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      ['_01', '_02', '_04', '_05'].map((id) => ({ codRep: `GRSCMIS${id}` })),
      nodo,
    );
  }

  /**
   * "Seguros Pasivos" — legado `repositorio/seguros-pasivos`.
   *
   * Cuatro bloques `RS_SEG_PAS_*`, devueltos en el orden en que el legado los
   * pinta (`_03` primero, que es el resumen), no en el orden en que los pide.
   */
  segurosPasivos(nodo: NodoConsulta): Observable<TablaDinamicaResultado[]> {
    const params = { tip_cod: nodo.tip_cod, cod_rel: nodo.cod_rel, fec: this.bloques.fecha() };
    return forkJoin(
      ['_03', '_01', '_02', '_04'].map((id) => this.bloques.tablaRegularCon(`RS_SEG_PAS${id}`, params)),
    );
  }

  /**
   * Las opciones del selector de periodo de "Seguros Optativos" — legado
   * `loadFilter()`, que usa `RS_FECH` (no el `RS_FECH02` de Gestión Comercial).
   */
  periodosSegurosOptativos(): Observable<OpcionFiltro[]> {
    return this.bloques.periodos('RS_FECH');
  }

  /**
   * "Reporte Seguros Optativos" — legado `repositorio/seguro-com` (`GRSCMISREP_01`).
   *
   * La `fec` es la del selector de periodo; si no llega, la de corte del
   * usuario, que es con la que abre el legado antes de que responda `RS_FECH`.
   */
  segurosOptativos(nodo: NodoConsulta, fec = this.bloques.fecha()): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegularCon('GRSCMISREP_01', {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      fec,
    });
  }

  /**
   * "Evolutivo Pasivos" — legado `repositorio/seguro-pasivos-graf`
   * (`GRAFSEGPAS_01` y `_02`).
   *
   * Estos dos bloques NO devuelven la forma normal de `graphicData`: vienen por
   * `regularData` y traen `categories` y `series` como texto serializado dentro
   * de `result.body[0]`. El legado los resuelve con `eval()`; acá se parsean
   * como JSON.
   *
   * OJO: si el backend emitiera literales de JavaScript en vez de JSON (claves
   * sin comillas, comillas simples), `JSON.parse` falla y el gráfico queda
   * vacío en vez de mostrar datos equivocados. No se usa `eval()` ni se
   * inventa un formato: si aparece vacío en producción hay que capturar un
   * payload real y ajustar el parseo.
   */
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

/**
 * Traduce un bloque `GRAFSEGPAS_*` al contrato de `<app-grafico-mixto>`.
 *
 * Devuelve `null` si el payload no se puede parsear, para que el componente
 * simplemente no pinte ese gráfico.
 */
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
