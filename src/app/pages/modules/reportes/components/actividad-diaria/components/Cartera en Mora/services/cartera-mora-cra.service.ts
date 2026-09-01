import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import { TODO } from '../../Portafolio Reasignado/models/portafolio-reasignado.model';
import {
  COD_CARTERA_MORA,
  COD_CARTERA_MORA_PAREJAS,
  CORTES_TOP_VARIABLES,
  MODOS_SEGUIMIENTO_PORTAFOLIO,
  TRAMOS_MONITOR_EFECTIVIDADES,
} from '../constantes/cartera-mora.constantes';
import type { ReporteBloqueUnico, TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { OpcionFiltro } from '../../../../../models/filtros.model';

/**
 * Los reportes de "Cartera en Mora", que salen de los hosts `report-cra-*` del
 * legado con jerarquía `UNI_1`. Solo arma peticiones: los códigos están en
 * `constantes/`.
 *
 * Tres cosas que NO son intercambiables entre reportes:
 *
 * - **El strand lo decide el HOST, no el mapa.** El `reportType` de
 *   `cra-map.ts` solo lo consulta `report-cra-v1p1`; los hosts `-v4`, `-v7` y
 *   `-v11` llaman directo a `getRegularData()`. Pedir por `reportData` un
 *   reporte de esos da HTTP 500.
 * - **El nombre del corte cambia.** Unos piden `fec` (lo agrega
 *   `BloqueReporteService`) y otros `fecha`; los hosts `-v4`/`-v7` no reciben
 *   `fec` en absoluto y van por `regularExacto()`.
 * - **Un bloque vacío responde 500.** Dentro de un `forkJoin` eso tumba el
 *   reporte entero, así que los de varios bloques usan `regularTolerante()`.
 */
@Injectable({ providedIn: 'root' })
export class CarteraMoraCraService {
  private readonly bloques = inject(BloqueReporteService);

  /** CMG Cartera en Mora. */
  cmgMora(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_CARTERA_MORA.cmgMora, nodo);
  }

  /** CMG Cartera en Mora Sin Impulso. */
  cmgMoraSinImpulso(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque(COD_CARTERA_MORA.cmgMoraSinImpulso, nodo);
  }

  /** Calidad de Cartera. Sus dos bloques piden `fecha`. */
  calidadCartera(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fecha = this.bloques.fec();
    return this.bloques.regulares(
      COD_CARTERA_MORA_PAREJAS.calidadCartera.map((codRep) => ({ codRep, extra: { fecha } })),
      nodo,
    );
  }

  /** Portafolios y Supervisión. */
  portafoliosSupervision(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.pareja(COD_CARTERA_MORA_PAREJAS.portafoliosSupervision, nodo);
  }

  /** Cero y una Cuota. */
  ceroUnaCuota(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.pareja(COD_CARTERA_MORA_PAREJAS.ceroUnaCuota, nodo);
  }

  /**
   * Monitor Efectividades — resumen: el `_01` más el `_03` por cada tramo, que
   * es como el legado arma sus dos "Resumen de Gestiones Ingresadas". El `_02`
   * es la otra pestaña y tiene sus propios filtros.
   */
  monitorEfectividadesResumen(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fecha = this.bloques.fec();
    return forkJoin([
      this.bloques.regularTolerante(COD_CARTERA_MORA.monitorEfectividadesResumen, nodo, { fecha }),
      ...TRAMOS_MONITOR_EFECTIVIDADES.map((tram) =>
        this.bloques.regularTolerante(COD_CARTERA_MORA.monitorEfectividadesTramo, nodo, { fecha, tram }),
      ),
    ]);
  }

  /** Monitor Efectividades — detalle: el único con filtros propios, y paginado. */
  monitorEfectividadesDetalle(
    nodo: NodoConsulta,
    filtros: Record<string, unknown>,
    pagina = 1,
  ): Observable<TablaReporteResultado> {
    // `pagen` va DESPUÉS de `filtros`: los filtros del detalle traen el suyo
    // fijo en 1 y, si quedara último, pisaría la página que se está pidiendo.
    return this.bloques.regularTolerante(COD_CARTERA_MORA.monitorEfectividadesDetalle, nodo, {
      fecha: this.bloques.fec(),
      ...filtros,
      pagen: pagina,
    });
  }

  /** Opciones de "Última Gestión", que el legado trae del backend. */
  opcionesUltimaGestion(): Observable<OpcionFiltro[]> {
    return this.bloques.regular(COD_CARTERA_MORA.opcionesUltimaGestion, { tip_cod: 0, cod_rel: '' }).pipe(
      map((tabla) => [
        { id: TODO, desc: 'TODO' },
        ...tabla.body.map((fila) => ({ id: String(fila['id'] ?? ''), desc: String(fila['desc'] ?? fila['id'] ?? '') })),
      ]),
    );
  }

  /** Seguimiento Reprogramados. */
  seguimientoReprogramados(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloqueV7(COD_CARTERA_MORA.seguimientoReprogramados, nodo);
  }

  /** Reporte de Pago Puntual. */
  reportePagoPuntual(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloqueV7(COD_CARTERA_MORA.reportePagoPuntual, nodo);
  }

  /** Efectividades Sin Asignar. Va paginado: sin `pagen` ni el nodo completo, el backend responde vacío. */
  efectividadesSinAsignar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regularPaginado(COD_CARTERA_MORA.efectividadesSinAsignar, nodo)
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Top Variables de Riesgo: el mismo bloque por grupo, corredores y unidades. */
  topVariablesRiesgo(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      CORTES_TOP_VARIABLES.map((extra) => ({ codRep: COD_CARTERA_MORA.topVariablesRiesgo, extra })),
      nodo,
    );
  }

  /**
   * Seguimiento de Portafolio: un solo bloque pedido una vez por `mode`. Su
   * entrada del mapa ya declara el corte como `fecha`, así que no lleva `fec`.
   * Va lento y tolerante: mueve mucha data y algún `mode` puede volver vacío.
   */
  seguimientoPortafolio(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fecha = this.bloques.fec();
    return forkJoin(
      MODOS_SEGUIMIENTO_PORTAFOLIO.map((mode) =>
        this.bloques.regularLento(COD_CARTERA_MORA.seguimientoPortafolio, nodo, { fecha, mode }),
      ),
    );
  }

  private unBloque(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }

  /**
   * Bloque único de un host `-v7`: solo los params del mapa (`fecha`), sin
   * `fec`, y con el timeout largo — mueven tanta data que no entran en 30 s.
   */
  private unBloqueV7(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regularLento(codRep, nodo, { fecha: this.bloques.fec() })
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  private pareja(codReps: readonly string[], nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(codReps.map((codRep) => ({ codRep })), nodo);
  }
}
