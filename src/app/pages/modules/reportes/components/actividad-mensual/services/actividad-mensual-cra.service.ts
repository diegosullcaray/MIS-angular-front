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
import type { BloqueGrafico } from '../../../../../../shared/ui/graficos/models/grafico-comun.model';

@Injectable({ providedIn: 'root' })
export class ActividadMensualCraService {
  private readonly bloques = inject(BloqueReporteService);

  private consultarRegular(codRep: string, nodo: NodoConsulta, extra?: Record<string, unknown>): Observable<ReporteBloqueUnico> {
    const obs = extra && Object.keys(extra).length > 0 ? this.bloques.regular(codRep, nodo, extra) : this.bloques.regular(codRep, nodo);
    return obs.pipe(map((tabla1: TablaReporteResultado) => ({ tabla1 })));
  }

  private consultarDeprecado(codRep: string, nodo: NodoConsulta, extra?: Record<string, unknown>): Observable<ReporteBloqueUnico> {
    const obs = extra && Object.keys(extra).length > 0 ? this.bloques.deprecado(codRep, nodo, extra) : this.bloques.deprecado(codRep, nodo);
    return obs.pipe(map((tabla1: TablaReporteResultado) => ({ tabla1 })));
  }

  /** Plan de Datos (`app_uso_m` -> `P_Datos_01`, host `cra-v1p1`). */
  planDatos(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('P_Datos_01', nodo, fec ? { fec } : undefined);
  }

  /** Huella Carbono (`huella-carbono-m` -> `HCARBONO_01`, host `cra-v3`). */
  huellaCarbono(nodo: NodoConsulta, cargambiental: string, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('HCARBONO_01', nodo, { cargambiental, ...(fec ? { fec } : {}) });
  }

  /** Gestión Cartera Reasignada Flujo (`gest_cart_her-flujo` -> `RS_AGE_COM_CRM_F`, host `cra-v11`). */
  gestionCarteraReasignadaFlujo(nodo: NodoConsulta, ver: number, fecha?: string): Observable<TablaReporteResultado[]> {
    const f = fecha ?? this.bloques.fecha();
    return this.bloques.regulares(
      [
        { codRep: 'RS_AGE_COM_CRM_F_01', extra: { ver, fecha: f } },
        { codRep: 'RS_AGE_COM_CRM_F_02', extra: { ver, fecha: f } },
      ],
      nodo,
    );
  }

  /** Gestión Cartera Stock (`gest_cart_stock` -> `RS_AGE_COM_CRM_S`, host `cra-v11`). */
  gestionCarteraStock(nodo: NodoConsulta, ver: number, tipo_ase: number, fecha?: string): Observable<TablaReporteResultado[]> {
    const f = fecha ?? this.bloques.fecha();
    return this.bloques.regulares(
      [
        { codRep: 'RS_AGE_COM_CRM_S_03', extra: { ver, tipo_ase, fecha: f } },
        { codRep: 'RS_AGE_COM_CRM_S_04', extra: { ver, tipo_ase, fecha: f } },
      ],
      nodo,
    );
  }

  /** CMG Captaciones (`cmg-capta` -> `GCMGCAP_01`, host `cra-v3`). */
  cmgCaptaciones(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('GCMGCAP_01', nodo, fec ? { fec } : undefined);
  }

  /** Seguimiento BP (`seg-bp-men` -> `CAP_SEGUI_BP_01`, host `cra-v3`). */
  seguimientoBp(nodo: NodoConsulta, prod: string, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('CAP_SEGUI_BP_01', nodo, { prod, ...(fec ? { fec } : {}) });
  }

  /** Captación por Canal Comercial (`capta-caract-canal-comercial-m` -> `CARACT_CARTERA_M_01`, host `cra-v1p1`). */
  captacionCanalComercial(nodo: NodoConsulta, prod: string, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('CARACT_CARTERA_M_01', nodo, { prod, ...(fec ? { fec } : {}) });
  }

  /** Captación Operacional (`capta-caract-canal-operacional-m` -> `CARACT_pas_M_01`, host `cra-v1p1`). */
  captacionOperacional(nodo: NodoConsulta, prod: string, segmento: string, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('CARACT_pas_M_01', nodo, { prod, segmento, ...(fec ? { fec } : {}) });
  }

  /** Cartera por Producto (`cart-prod` -> gráfico `cartera_producto_rma_01`, tabla `cartera_producto_rma_02`, host `cra-v3`). */
  carteraProducto(nodo: NodoConsulta, fec?: string): Observable<CarteraProductoResultado> {
    const extra = fec ? { fec } : undefined;
    const tabla$ = this.bloques.deprecado('rma/administracion/Cartera/cartera_producto_rma_02', nodo, extra);
    const graficos$ = this.bloques.graficos('rma/administracion/Cartera/cartera_producto_rma_01', nodo, extra);

    return forkJoin({ tabla: tabla$, graficos: graficos$ }).pipe(
      map(({ tabla, graficos }) => ({
        tabla,
        graficos,
        tarjetas: extraerTarjetasCarteraProducto(tabla, graficos),
      }))
    );
  }

  /** Programas del Gobierno (`pro-gob-m` -> `RPROGOB_M`, host `cra-v1p3`). */
  programasGobierno(nodo: NodoConsulta, fec?: string): Observable<TablaReporteResultado[]> {
    const extraFec = fec ? { fec } : {};
    return this.bloques.regulares(
      [
        { codRep: 'RPROGOB_M_01', extra: { var: 1, ...extraFec } },
        { codRep: 'RPROGOB_M_02', extra: { var: 2, ...extraFec } },
        { codRep: 'RPROGOB_M_03', extra: { var: 1, ...extraFec } },
        { codRep: 'RPROGOB_M_04', extra: { var: 2, ...extraFec } },
      ],
      nodo,
    );
  }

  /** Contratación Electrónica (`cont-elect-m` -> `CONT_ELECT_M`, host `cra-v1p1`). */
  contratacionElectronica(nodo: NodoConsulta, fec?: string): Observable<TablaReporteResultado[]> {
    const extra = fec ? { fec } : undefined;
    return this.bloques.regulares(
      [
        { codRep: 'CONT_ELECT_M_01', ...(extra ? { extra } : {}) },
        { codRep: 'CONT_ELECT_M_02', ...(extra ? { extra } : {}) },
        { codRep: 'CONT_ELECT_M_03', ...(extra ? { extra } : {}) },
      ],
      nodo,
    );
  }

  /** Ranking de Autonomías de Tasas (`rep-aut-tas` -> `reporte_autonomia_new_01`, host `cra-v1p1`). */
  rankingAutonomiasTasas(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('reporte_autonomia_new_01', nodo, fec ? { fec } : undefined);
  }

  /** Tasas Mes por Producto (`tp-mes` -> `rma/administracion/Cartera/tasa_producto_rma_01`, host `cra-v3`). */
  tasasMesProducto(nodo: NodoConsulta, fec?: string): Observable<TasasMesProductoResultado> {
    return this.bloques
      .graficos('rma/administracion/Cartera/tasa_producto_rma_01', nodo, fec ? { fec } : undefined)
      .pipe(
        map((graficos) => ({
          graficos,
          tarjetas: extraerTarjetasTasasProducto(graficos),
        }))
      );
  }

  /** Comite de Créditos (`seg_comite` -> `SEGUI_COMITE_01`, host `cra-v3`). */
  comiteCreditos(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('SEGUI_COMITE_01', nodo, fec ? { fec } : undefined);
  }

  /** Datos por Producto (`dat-prod-men` -> `RS_DAT_PRO`, host `cra-v3`). */
  datosProducto(nodo: NodoConsulta, fecha?: string): Observable<TablaReporteResultado[]> {
    const f = fecha ?? this.bloques.fecha();
    return this.bloques.regulares(
      [
        { codRep: 'RS_DAT_PRO_01', extra: { fecha: f } },
        { codRep: 'RS_DAT_PRO_02', extra: { fecha: f } },
        { codRep: 'RS_DAT_PRO_03', extra: { fecha: f } },
        { codRep: 'RS_DAT_PRO_04', extra: { fecha: f } },
      ],
      nodo,
    );
  }

  /** CMG Cartera en Mora (`cmg-mora` -> `cuadro_Variable_M_01`, host `cra-v1p1`). */
  cmgCarteraMora(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('cuadro_Variable_M_01', nodo, fec ? { fec } : undefined);
  }

  /** Evolutivo Cosechas (`graf-cosechas` -> `rma/administracion/Riesgos/grafico_cosechas_01`, host `cra-v3`). */
  evolutivoCosechas(nodo: NodoConsulta, prod: string, subpro: string, madu: string, op: string, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarDeprecado('rma/administracion/Riesgos/grafico_cosechas_01', nodo, { prod, subpro, madu, op, ...(fec ? { fec } : {}) });
  }

  /** Monitor Efectividades (`mon-efec` -> `RS_MON_EFECM`, host `cra-v4`). */
  monitorEfectividades(nodo: NodoConsulta, fecha?: string): Observable<TablaReporteResultado[]> {
    const f = fecha ?? this.bloques.fecha();
    return this.bloques.regulares(
      [
        { codRep: 'RS_MON_EFECM_01', extra: { fecha: f } },
        { codRep: 'RS_MON_EFECM_02', extra: { fecha: f } },
        { codRep: 'RS_MON_EFECM_03', extra: { fecha: f, tram: '1. -30-0' } },
        { codRep: 'RS_MON_EFECM_03', extra: { fecha: f, tram: '2. 1-30' } },
      ],
      nodo,
    );
  }

  /** Mora y Efectividad por Tramos (`mor-efe` -> `rma/administracion/Mora/mora_efectividad_tramos_rma_01`, host `cra-v3`). */
  moraEfectividadTramos(nodo: NodoConsulta, fec?: string): Observable<MoraEfectividadTramosResultado> {
    return this.bloques
      .graficos('rma/administracion/Mora/mora_efectividad_tramos_rma_01', nodo, fec ? { fec } : undefined)
      .pipe(
        map((graficos) => ({
          graficos,
          tarjetas: extraerTarjetasMoraEfectividad(graficos),
        }))
      );
  }

  /** Monitor Efectividades Reasignados (`mon-efec-reasig` -> `RS_MON_EFECREASIGM`, host `cra-v12`). */
  monitorEfectividadesReasignados(nodo: NodoConsulta, fecha?: string): Observable<TablaReporteResultado[]> {
    const f = fecha ?? this.bloques.fecha();
    return this.bloques.regulares(
      [
        { codRep: 'RS_MON_EFECREASIGM_01', extra: { fecha: f } },
        { codRep: 'RS_MON_EFECREASIGM_02', extra: { fecha: f } },
      ],
      nodo,
    );
  }

  /** Dashboard Cero Cuota Nueva (`graf-dashboard-CN` -> `rma/administracion/mora/Dashboard_rma_01`, host `cra-v3`). */
  dashboardCeroCuotaNueva(nodo: NodoConsulta, fec?: string): Observable<BloqueGrafico[]> {
    return this.bloques.graficos('rma/administracion/mora/Dashboard_rma_01', nodo, fec ? { fec } : undefined);
  }

  /** Gestión de Cartera Reasignada Mes (`gest_cart_her` -> `RS_AGE_COM_CRM`, host `cra-v11`). */
  gestionCarteraReasignadaMes(nodo: NodoConsulta, ver: number, fecha?: string): Observable<TablaReporteResultado[]> {
    const f = fecha ?? this.bloques.fecha();
    return this.bloques.regulares(
      [
        { codRep: 'RS_AGE_COM_CRM_01', extra: { ver, fecha: f } },
        { codRep: 'RS_AGE_COM_CRM_02', extra: { ver, fecha: f } },
      ],
      nodo,
    );
  }

  /** CMG Cartera en Mora Sin Impulsa (`cmg-mora-simp-m` -> `cmg_mora_simp_m_01`, host `cra-v1p1`). */
  cmgCarteraMoraSinImpulsa(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('cmg_mora_simp_m_01', nodo, fec ? { fec } : undefined);
  }

  /** Semáforo de Cosechas (`sema-cosechas` -> `COSESEMAFORO_01`, host `cra-v1p1`). */
  semaforoCosechas(nodo: NodoConsulta, prod: string, subpro: string, madu: string, op: string, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('COSESEMAFORO_01', nodo, { prod, subpro, madu, op, ...(fec ? { fec } : {}) });
  }

  /** CMG Clientes del Activo (`cmg-cli` -> `rma/administracion/Clientes/cmg_clientes_rma_01`, host `cra-v2`). */
  cmgClientesActivo(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarDeprecado('rma/administracion/Clientes/cmg_clientes_rma_01', nodo, fec ? { fec } : undefined);
  }

  /** Desempeño Social (`desemp-social` -> `DESEMP_SOC_01`, host `cra-v3`). */
  desempenoSocial(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('DESEMP_SOC_01', nodo, fec ? { fec } : undefined);
  }

  /** CMG Clientes Flujo (`cmg_cliente_flujo` -> `CMG_CLIF_01`, host `cra-v3`). */
  cmgClientesFlujo(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('CMG_CLIF_01', nodo, fec ? { fec } : undefined);
  }

  /** Resultados por Unidad de Negocio (`res-un` -> `resultado_unidad_negocio_rma_01`, host `cra-v1p1`). */
  resultadosUnidadNegocio(nodo: NodoConsulta, canal: string, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('resultado_unidad_negocio_rma_01', nodo, { canal, ...(fec ? { fec } : {}) });
  }

  /** Ranking Kaypacha Comercial (`rank-kay` -> `rankKay_01`, host `cra-v1p8`). */
  rankingKaypachaComercial(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('rankKay_01', nodo, fec ? { fec } : undefined);
  }

  /** Ranking Kaypacha Operaciones (`rank-kay-ope` -> `rankKayOpe_01`, host `cra-v1p8`). */
  rankingKaypachaOperaciones(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('rankKayOpe_01', nodo, fec ? { fec } : undefined);
  }

  /** Ranking Kaypacha Recuperaciones (`rank-kay-recu` -> `rankKayrecu_01`, host `cra-v1p8`). */
  rankingKaypachaRecuperaciones(nodo: NodoConsulta, fec?: string): Observable<ReporteBloqueUnico> {
    return this.consultarRegular('rankKayrecu_01', nodo, fec ? { fec } : undefined);
  }
}
