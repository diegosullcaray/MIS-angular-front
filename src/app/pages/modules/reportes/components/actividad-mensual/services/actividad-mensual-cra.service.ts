import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico, TablaReporteResultado } from '../../../models/tabla-reporte.model';
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

  /** Gestión Cartera Reasignada Flujo. */
  gestionCarteraReasignadaFlujo(nodo: NodoConsulta, ver: number, fecha?: string): Observable<TablaReporteResultado[]> {
    const f = fecha ?? this.bloques.fecha();
    return this.mismosParams(COD_MENSUAL_MULTIBLOQUE.gestionCarteraReasignadaFlujo, nodo, { ver, fecha: f });
  }

  /** Gestión Cartera Stock. */
  gestionCarteraStock(nodo: NodoConsulta, ver: number, tipo_ase: number, fecha?: string): Observable<TablaReporteResultado[]> {
    const f = fecha ?? this.bloques.fecha();
    return this.mismosParams(COD_MENSUAL_MULTIBLOQUE.gestionCarteraStock, nodo, { ver, tipo_ase, fecha: f });
  }

  /** CMG Captaciones. */
  cmgCaptaciones(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.cmgCaptaciones, nodo, fec ? { fec } : undefined);
  }

  /** Seguimiento BP. */
  seguimientoBp(nodo: NodoConsulta, prod: string, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.seguimientoBp, nodo, { prod, ...(fec ? { fec } : {}) });
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

  /** Comite de Créditos. */
  comiteCreditos(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.comiteCreditos, nodo, fec ? { fec } : undefined);
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

  /** Evolutivo Cosechas. */
  evolutivoCosechas(nodo: NodoConsulta, prod: string, subpro: string, madu: string, op: string, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarDeprecado(COD_MENSUAL_DEPRECADO.evolutivoCosechas, nodo, { prod, subpro, madu, op, ...(fec ? { fec } : {}) });
  }

  /** Monitor Efectividades. */
  monitorEfectividades(nodo: NodoConsulta, fecha?: string): Observable<TablaReporteResultado[]> {
    const f = fecha ?? this.bloques.fecha();
    const bloques = BLOQUES_MONITOR_EFECTIVIDADES.map(({ codRep, tram }) => ({
      codRep,
      extra: { fecha: f, ...(tram ? { tram } : {}) },
    }));
    return this.bloques.regulares(bloques, nodo);
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
  monitorEfectividadesReasignados(nodo: NodoConsulta, fecha?: string): Observable<TablaReporteResultado[]> {
    const f = fecha ?? this.bloques.fecha();
    return this.mismosParams(COD_MENSUAL_MULTIBLOQUE.monitorEfectividadesReasignados, nodo, { fecha: f });
  }

  /** Dashboard Cero Cuota Nueva. */
  dashboardCeroCuotaNueva(nodo: NodoConsulta, fec?: string): Observable<BloqueGrafico[]> {
    return this.bloques.graficos(COD_MENSUAL_DEPRECADO.dashboardCeroCuotaNueva, nodo, fec ? { fec } : undefined);
  }

  /** Gestión de Cartera Reasignada Mes. */
  gestionCarteraReasignadaMes(nodo: NodoConsulta, ver: number, fecha?: string): Observable<TablaReporteResultado[]> {
    const f = fecha ?? this.bloques.fecha();
    return this.mismosParams(COD_MENSUAL_MULTIBLOQUE.gestionCarteraReasignadaMes, nodo, { ver, fecha: f });
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

  /** Desempeño Social. */
  desempenoSocial(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular(COD_MENSUAL_CRA.desempenoSocial, nodo, fec ? { fec } : undefined);
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
