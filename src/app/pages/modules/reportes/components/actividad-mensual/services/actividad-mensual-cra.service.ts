import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, merge, scan } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../services/bloque-reporte.service';
import { TABLA_PENDIENTE, type ReporteBloqueUnico, type TablaReporteResultado } from '../../../models/tabla-reporte.model';
import type { OpcionFiltro } from '../../../models/filtros.model';
import {
  type CarteraProductoResultado,
  extraerTarjetasCarteraProducto,
} from '../components/Cartera/items/cartera-producto/models/cartera-producto.model';
import {
  type TasasMesProductoResultado,
  extraerTarjetasTasasProducto,
} from '../components/Cartera/items/tasas-mes-producto/models/tasas-mes-producto.model';
import {
  type MoraEfectividadTramosResultado,
  extraerTarjetasMoraEfectividad,
} from '../components/Cartera en Mora/items/mora-efectividad-tramos/models/mora-efectividad-tramos.model';
import {
  BLOQUES_MONITOR_EFECTIVIDADES,
  BLOQUES_PROGRAMAS_GOBIERNO,
  COD_MENSUAL_CRA,
  COD_MENSUAL_DEPRECADO,
  COD_MENSUAL_MULTIBLOQUE,
  COD_MONITOR_EFECTIVIDADES_DETALLE,
  COD_MONITOR_EFECTIVIDADES_REASIGNADOS_RESUMEN,
  type ReporteGestionCarteraReasignadaMensual,
} from '../constantes/actividad-mensual.constantes';
import type { BloqueGrafico } from '../../../../../../shared/ui/graficos/models/grafico-comun.model';

/**
 * Los reportes de Actividad Mensual que cuelgan de los hosts `cra-*`.
 *
 * Solo arma peticiones: los `cod_rep`, con su ruta del legado y su host, están
 * en `constantes/actividad-mensual.constantes.ts`.
 */
@Injectable({ providedIn: 'root' })
export class ActividadMensualCraService {
  private readonly bloques = inject(BloqueReporteService);

  private consultarRegular(codRep: string, nodo: NodoConsulta, extra?: Record<string, unknown>): Observable<ReporteBloqueUnico> {
    const obs = extra && Object.keys(extra).length > 0 ? this.bloques.regular(codRep, nodo, extra) : this.bloques.regular(codRep, nodo);
    return obs.pipe(map((tabla1: TablaReporteResultado) => ({ tabla1 })));
  }

  /** Varios bloques del mismo reporte, todos con los mismos parámetros. */
  private mismosParams(
    codReps: readonly string[],
    nodo: NodoConsulta,
    extra?: Record<string, unknown>,
  ): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      codReps.map((codRep) => ({ codRep, ...(extra ? { extra } : {}) })),
      nodo,
    );
  }

  private consultarDeprecado(codRep: string, nodo: NodoConsulta, extra?: Record<string, unknown>): Observable<ReporteBloqueUnico> {
    const obs = extra && Object.keys(extra).length > 0 ? this.bloques.deprecado(codRep, nodo, extra) : this.bloques.deprecado(codRep, nodo);
    return obs.pipe(map((tabla1: TablaReporteResultado) => ({ tabla1 })));
  }

  /** Plan de Datos. */
  planDatos(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.planDatos, nodo, fec ? { fec } : undefined);
  }

  /** Huella Carbono. */
  huellaCarbono(nodo: NodoConsulta, cargambiental: string, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.huellaCarbono, nodo, { cargambiental, ...(fec ? { fec } : {}) });
  }

  /** Gestión de Cartera Reasignada mensual, pestaña "Resumen" (`_01`), con "Mostrar por" y la Fecha Cierre. */
  gestionCarteraReasignadaResumen(
    reporte: ReporteGestionCarteraReasignadaMensual,
    nodo: NodoConsulta,
    ver: number,
    fecha: string,
  ): Observable<TablaReporteResultado> {
    return this.bloques.regularTolerante(`${reporte}_01`, nodo, { ver, fecha });
  }

  /**
   * Gestión de Cartera Reasignada mensual, pestaña "Detalle": el `_03` paginado, con `pagen` y el
   * nodo COMPLETO de la jerarquía (`rendererSync()` de `cra-v11`). Antes se pedía el `_02` sin
   * paginar y solo con `tip_cod`/`cod_rel`, y el detalle no mostraba filas.
   */
  gestionCarteraReasignadaDetalle(
    reporte: ReporteGestionCarteraReasignadaMensual,
    nodo: NodoConsulta,
    ver: number,
    fecha: string,
    pagina = 1,
  ): Observable<TablaReporteResultado> {
    return this.bloques.regularPaginadoTolerante(`${reporte}_03`, nodo, { ver, fecha }, pagina);
  }

  /** CMG Captaciones. */
  cmgCaptaciones(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.cmgCaptaciones, nodo, fec ? { fec } : undefined);
  }

  /** Captación por Canal Comercial. */
  captacionCanalComercial(nodo: NodoConsulta, prod: string, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.captacionCanalComercial, nodo, { prod, ...(fec ? { fec } : {}) });
  }

  /** Captación Operacional. */
  captacionOperacional(nodo: NodoConsulta, prod: string, segmento: string, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.captacionOperacional, nodo, { prod, segmento, ...(fec ? { fec } : {}) });
  }

  /** Cartera por Producto. */
  carteraProducto(nodo: NodoConsulta, fec?: string): Observable<CarteraProductoResultado> {
    const extra = fec ? { fec } : undefined;
    const tabla$ = this.bloques.deprecado(COD_MENSUAL_DEPRECADO.carteraProductoTabla, nodo, extra);
    const graficos$ = this.bloques.graficos(COD_MENSUAL_DEPRECADO.carteraProductoGraficos, nodo, extra);

    return forkJoin({ tabla: tabla$, graficos: graficos$ }).pipe(
      map(({ tabla, graficos }) => ({
        tabla,
        graficos,
        tarjetas: extraerTarjetasCarteraProducto(tabla, graficos),
      }))
    );
  }

  /** Programas del Gobierno. */
  programasGobierno(nodo: NodoConsulta, fec?: string): Observable<TablaReporteResultado[]> {
    const extraFec = fec ? { fec } : {};
    const bloques = BLOQUES_PROGRAMAS_GOBIERNO.map(({ codRep, var: variante }) => ({
      codRep,
      extra: { var: variante, ...extraFec },
    }));
    return this.bloques.regulares(bloques, nodo);
  }

  /** Contratación Electrónica. */
  contratacionElectronica(nodo: NodoConsulta, fec?: string): Observable<TablaReporteResultado[]> {
    return this.mismosParams(COD_MENSUAL_MULTIBLOQUE.contratacionElectronica, nodo, fec ? { fec } : undefined);
  }

  /** Ranking de Autonomías de Tasas. */
  rankingAutonomiasTasas(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.rankingAutonomiasTasas, nodo, fec ? { fec } : undefined);
  }

  /** Tasas Mes por Producto. */
  tasasMesProducto(nodo: NodoConsulta, fec?: string): Observable<TasasMesProductoResultado> {
    return this.bloques
      .graficos(COD_MENSUAL_DEPRECADO.tasasMesProducto, nodo, fec ? { fec } : undefined)
      .pipe(
        map((graficos) => ({
          graficos,
          tarjetas: extraerTarjetasTasasProducto(graficos),
        }))
      );
  }

  /** Datos por Producto. */
  datosProducto(nodo: NodoConsulta, fecha?: string): Observable<TablaReporteResultado[]> {
    const f = fecha ?? this.bloques.fecha();
    return this.mismosParams(COD_MENSUAL_MULTIBLOQUE.datosProducto, nodo, { fecha: f });
  }

  /** CMG Cartera en Mora. */
  cmgCarteraMora(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.cmgCarteraMora, nodo, fec ? { fec } : undefined);
  }

  /**
   * Gráfico de Cosechas (`graf-cosechas`) — legado `rma/administracion/Riesgos/grafico_cosechas`
   * sobre el host `cra-v3`: es un **gráfico** (`graphic: _01`), pedido con `getGraphicData` y solo
   * con el nivel y sus cuatro filtros (sin fecha). Antes se pedía como tabla deprecada y fallaba.
   */
  evolutivoCosechas(nodo: NodoConsulta, prod: string, subpro: string, madu: string, op: string): Observable<BloqueGrafico[]> {
    return this.bloques.graficosExacto(COD_MENSUAL_DEPRECADO.evolutivoCosechas, nodo, { prod, subpro, madu, op });
  }

  /** Monitor Efectividades. */
  monitorEfectividades(nodo: NodoConsulta, fecha: string): Observable<TablaReporteResultado[]> {
    // Carga independiente y tolerante: un tramo sin filas (500 de Ant) no tumba los otros bloques.
    const respuestas = BLOQUES_MONITOR_EFECTIVIDADES.map(({ codRep, tram }, i) =>
      this.bloques.regularTolerante(codRep, nodo, { fecha, ...(tram ? { tram } : {}) }).pipe(map((tabla) => ({ i, tabla }))),
    );
    return merge(...respuestas).pipe(
      scan(
        (tablas, { i, tabla }) => tablas.map((t, j) => (j === i ? tabla : t)),
        BLOQUES_MONITOR_EFECTIVIDADES.map(() => TABLA_PENDIENTE),
      ),
    );
  }

  /**
   * "Detalle de Efectividades" (`_02` de `mon-efec` o de `mon-efec-reasig`): paginado en el
   * servidor y con sus filtros propios. Como el legado (`rendererSync()` de `cra-v4`/`cra-v12`),
   * va con `pagen` y el nodo COMPLETO de la jerarquía; `pagen` va después de los filtros para que
   * la página pedida no se pise.
   */
  detalleEfectividades(
    reporte: keyof Pick<typeof COD_MONITOR_EFECTIVIDADES_DETALLE, 'monitor' | 'reasignados'>,
    nodo: NodoConsulta,
    fecha: string,
    filtros: Record<string, unknown>,
    pagina = 1,
  ): Observable<TablaReporteResultado> {
    return this.bloques.regularPaginadoTolerante(COD_MONITOR_EFECTIVIDADES_DETALLE[reporte], nodo, { fecha, ...filtros, pagen: pagina }, pagina);
  }

  /** Opciones de "Última Gestión" del detalle, que el legado trae del backend (`SEL_EFEC_01`). */
  opcionesUltimaGestion(): Observable<OpcionFiltro[]> {
    return this.bloques.regular(COD_MONITOR_EFECTIVIDADES_DETALLE.opcionesUltimaGestion, { tip_cod: 0, cod_rel: '' }).pipe(
      map((tabla) => [
        { id: 'TODO', desc: 'TODO' },
        ...tabla.body.map((fila) => ({ id: String(fila['id'] ?? ''), desc: String(fila['desc'] ?? fila['id'] ?? '') })),
      ]),
    );
  }

  /** Mora y Efectividad por Tramos. */
  moraEfectividadTramos(nodo: NodoConsulta, fec?: string): Observable<MoraEfectividadTramosResultado> {
    return this.bloques
      .graficos(COD_MENSUAL_DEPRECADO.moraEfectividadTramos, nodo, fec ? { fec } : undefined)
      .pipe(
        map((graficos) => ({
          graficos,
          tarjetas: extraerTarjetasMoraEfectividad(graficos),
        }))
      );
  }

  /** Monitor Efectividades Reasignados. */
  monitorEfectividadesReasignados(nodo: NodoConsulta, fecha: string): Observable<TablaReporteResultado> {
    return this.bloques.regularTolerante(COD_MONITOR_EFECTIVIDADES_REASIGNADOS_RESUMEN, nodo, { fecha });
  }

  /** Dashboard Cero Cuota Nueva. */
  dashboardCeroCuotaNueva(nodo: NodoConsulta, fec?: string): Observable<BloqueGrafico[]> {
    return this.bloques.graficos(COD_MENSUAL_DEPRECADO.dashboardCeroCuotaNueva, nodo, fec ? { fec } : undefined);
  }

  /** CMG Cartera en Mora Sin Impulsa. */
  cmgCarteraMoraSinImpulsa(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.cmgCarteraMoraSinImpulsa, nodo, fec ? { fec } : undefined);
  }

  /** Semáforo de Cosechas. */
  semaforoCosechas(nodo: NodoConsulta, prod: string, subpro: string, madu: string, op: string, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.semaforoCosechas, nodo, { prod, subpro, madu, op, ...(fec ? { fec } : {}) });
  }

  /** CMG Clientes del Activo. */
  cmgClientesActivo(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarDeprecado(COD_MENSUAL_DEPRECADO.cmgClientesActivo, nodo, fec ? { fec } : undefined);
  }


  /** CMG Clientes Flujo. */
  cmgClientesFlujo(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.cmgClientesFlujo, nodo, fec ? { fec } : undefined);
  }

  /** Resultados por Unidad de Negocio. */
  resultadosUnidadNegocio(nodo: NodoConsulta, canal: string, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.resultadosUnidadNegocio, nodo, { canal, ...(fec ? { fec } : {}) });
  }

  /** Ranking Kaypacha Comercial. */
  rankingKaypachaComercial(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.rankingKaypachaComercial, nodo, fec ? { fec } : undefined);
  }

  /** Ranking Kaypacha Operaciones. */
  rankingKaypachaOperaciones(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.rankingKaypachaOperaciones, nodo, fec ? { fec } : undefined);
  }

  /** Ranking Kaypacha Recuperaciones. */
  rankingKaypachaRecuperaciones(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.rankingKaypachaRecuperaciones, nodo, fec ? { fec } : undefined);
  }
}
