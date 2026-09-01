import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { OpcionFiltro } from '../../../../../models/filtros.model';
import { TODO } from '../models/portafolio-reasignado.model';
import { COD_PORTAFOLIO_REASIGNADO } from '../constantes/portafolio-reasignado.constantes';

/** Servicios para reportes de Portafolio Reasignado. */
@Injectable({ providedIn: 'root' })
export class PortafolioReasignadoService {
  private readonly bloques = inject(BloqueReporteService);

  /** Reporte de Efectividad por Tramos. */
  efectividadPorTramos(nodo: NodoConsulta, imp: number): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegularCon(COD_PORTAFOLIO_REASIGNADO.efectividadPorTramos, {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      fec: this.bloques.fecha(),
      imp,
    });
  }

  /** Resumen de Gestión de Cartera Reasignada. */
  gestionResumen(nodo: NodoConsulta, ver: number): Observable<TablaReporteResultado> {
    return this.bloqueConFecha(COD_PORTAFOLIO_REASIGNADO.gestionResumen, nodo, { ver });
  }

  /** Detalle de Gestión de Cartera Reasignada. */
  gestionDetalle(nodo: NodoConsulta, ver: number, extra: Record<string, unknown>): Observable<TablaReporteResultado> {
    return this.bloqueConFecha(COD_PORTAFOLIO_REASIGNADO.gestionDetalle, nodo, { ver, ...extra });
  }

  /** Resumen de Monitor Efectividades Reasignados. */
  monitorResumen(nodo: NodoConsulta): Observable<TablaReporteResultado> {
    return this.bloqueConFecha(COD_PORTAFOLIO_REASIGNADO.monitorResumen, nodo);
  }

  /** Detalle de Monitor Efectividades Reasignados. */
  monitorDetalle(nodo: NodoConsulta, extra: Record<string, unknown>): Observable<TablaReporteResultado> {
    return this.bloqueConFecha(COD_PORTAFOLIO_REASIGNADO.monitorDetalle, nodo, extra);
  }

  /** Opciones de Última Gestión. */
  opcionesUltimaGestion(): Observable<OpcionFiltro[]> {
    return this.bloques.regular(COD_PORTAFOLIO_REASIGNADO.opcionesUltimaGestion, { tip_cod: 0, cod_rel: '' }).pipe(
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
