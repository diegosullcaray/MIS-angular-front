import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { OpcionFiltro } from '../../../../../models/filtros.model';
import { TODO } from '../../Portafolio Reasignado/models/portafolio-reasignado.model';
import type { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';

/** Servicios para reportes de Cartera en Mora. */
@Injectable({ providedIn: 'root' })
export class CarteraMoraCraService {
  private readonly bloques = inject(BloqueReporteService);

  /** CMG Cartera en Mora. */
  cmgMora(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('cuadro_Variable_Riesgo_01', nodo);
  }

  /** CMG Cartera en Mora Sin Impulso. */
  cmgMoraSinImpulso(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloque('cmg_mora_simp_01', nodo);
  }

  /** Calidad de Cartera. */
  calidadCartera(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.variosConFecha('RS_CAL_CAR', ['_01', '_02'], nodo);
  }

  /** Portafolios y Supervisión. */
  portafoliosSupervision(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares([{ codRep: 'PORTSUPE_01' }, { codRep: 'PORTSUPE_02' }], nodo);
  }

  /** Cero y una Cuota. */
  ceroUnaCuota(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares([{ codRep: 'CEROYCUOTA_01' }, { codRep: 'CEROYCUOTA_02' }], nodo);
  }

  /** Resumen de Monitor de Efectividades. */
  monitorEfectividadesResumen(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fecha = this.bloques.fec();
    return forkJoin([
      this.bloques.regularTolerante('RS_MON_EFEC_01', nodo, { fecha }),
      this.bloques.regularTolerante('RS_MON_EFEC_03', nodo, { fecha, tram: '1. -30-0' }),
      this.bloques.regularTolerante('RS_MON_EFEC_03', nodo, { fecha, tram: '2. 1-30' }),
    ]);
  }

  /** Detalle de Monitor de Efectividades. */
  monitorEfectividadesDetalle(
    nodo: NodoConsulta,
    filtros: Record<string, unknown>,
    pagina = 1,
  ): Observable<TablaReporteResultado> {

    return this.bloques.regularTolerante('RS_MON_EFEC_02', nodo, {
      fecha: this.bloques.fec(),
      ...filtros,
      pagen: pagina,
    });
  }

  /** Opciones de Última Gestión. */
  opcionesUltimaGestion(): Observable<OpcionFiltro[]> {
    return this.bloques.regular('SEL_EFEC_01', { tip_cod: 0, cod_rel: '' }).pipe(
      map((tabla) => [
        { id: TODO, desc: 'TODO' },
        ...tabla.body.map((fila) => ({ id: String(fila['id'] ?? ''), desc: String(fila['desc'] ?? fila['id'] ?? '') })),
      ]),
    );
  }

  /** Seguimiento Reprogramados. */
  seguimientoReprogramados(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloqueV7('RS_MON_EFECREPRO_01', nodo);
  }

  /** Reporte de Pago Puntual. */
  reportePagoPuntual(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.unBloqueV7('RS_MON_EFECTRAMOSC_01', nodo);
  }

  /** Efectividades Sin Asignar. */
  efectividadesSinAsignar(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regularPaginado('RMESA_01', nodo).pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Top Variables de Riesgos. */
  topVariablesRiesgo(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      [
        { codRep: 'RSRTOPV01', extra: { tip_cod2: '7', level: '2' } },
        { codRep: 'RSRTOPV01', extra: { tip_cod2: '20', level: '1' } },
        { codRep: 'RSRTOPV01', extra: { tip_cod2: '18', level: '1' } },
      ],
      nodo,
    );
  }

  /** Seguimiento de Portafolio. */
  seguimientoPortafolio(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fecha = this.bloques.fec();
    return forkJoin(
      [1, 2, 3].map((mode) => this.bloques.regularLento('RS_AVA_POR_01', nodo, { fecha, mode })),
    );
  }

  private unBloque(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regular(codRep, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }

  /** Obtiene bloque único con timeout extendido. */
  private unBloqueV7(codRep: string, nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques
      .regularLento(codRep, nodo, { fecha: this.bloques.fec() })
      .pipe(map((tabla1) => ({ tabla1 })));
  }

  private variosConFecha(modulo: string, ids: string[], nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fecha = this.bloques.fec();
    return this.bloques.regulares(
      ids.map((id) => ({ codRep: `${modulo}${id}`, extra: { fecha } })),
      nodo,
    );
  }

}
