import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { OpcionFiltro } from '../../../../../models/filtros.model';
import { TODO } from '../models/portafolio-reasignado.model';

/** Servicios para reportes de Portafolio Reasignado. */
@Injectable({ providedIn: 'root' })
export class PortafolioReasignadoService {
  private readonly bloques = inject(BloqueReporteService);

  /** Reporte de Efectividad por Tramos. */
  efectividadPorTramos(nodo: NodoConsulta, imp: number): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegularCon('RS_MON_EFECREASIG_03', {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      fec: this.bloques.fecha(),
      imp,
    });
  }

  /** Resumen de Gestión de Cartera Reasignada. */
  gestionResumen(nodo: NodoConsulta, ver: number): Observable<TablaReporteResultado> {
    return this.bloqueConFecha('RS_AGE_COM_CR_01', nodo, { ver });
  }

  /** Detalle de Gestión de Cartera Reasignada. */
  gestionDetalle(nodo: NodoConsulta, ver: number, extra: Record<string, unknown>): Observable<TablaReporteResultado> {
    return this.bloqueConFecha('RS_AGE_COM_CR_03', nodo, { ver, ...extra });
  }

  /** Resumen de Monitor Efectividades Reasignados. */
  monitorResumen(nodo: NodoConsulta): Observable<TablaReporteResultado> {
    return this.bloqueConFecha('RS_MON_EFECREASIG_01', nodo);
  }

  /** Detalle de Monitor Efectividades Reasignados. */
  monitorDetalle(nodo: NodoConsulta, extra: Record<string, unknown>): Observable<TablaReporteResultado> {
    return this.bloqueConFecha('RS_MON_EFECREASIG_02', nodo, extra);
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

  /** Bloque con parámetro fecha. */
  private bloqueConFecha(
    codRep: string,
    nodo: NodoConsulta,
    extra: Record<string, unknown> = {},
  ): Observable<TablaReporteResultado> {
    return this.bloques.regular(codRep, nodo, { fecha: this.bloques.fec(), ...extra });
  }
}
