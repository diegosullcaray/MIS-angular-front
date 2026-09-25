import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { OpcionFiltro } from '../../../../../models/filtros.model';
import { TODO } from '../models/portafolio-reasignado.model';
import { COD_PORTAFOLIO_REASIGNADO } from '../constantes/portafolio-reasignado.constantes';

/** Servicios para reportes de Portafolio Reasignado. */
@Injectable({ providedIn: 'root' })
export class PortafolioReasignadoService {
  private readonly bloques = inject(BloqueReporteService);

  /** Resumen de Gestión de Cartera Reasignada. */
  gestionResumen(nodo: NodoConsulta, ver: number): Observable<TablaReporteResultado> {
    return this.bloqueConFecha(COD_PORTAFOLIO_REASIGNADO.gestionResumen, nodo, { ver });
  }

  /**
   * Detalle de Gestión de Cartera Reasignada (`RS_AGE_COM_CR_03`, pestaña "Detalle" de `cra-v11`).
   *
   * El legado (`rendererSync()`) lo pide paginado: `pagen`, el nodo COMPLETO de la jerarquía, el
   * `fecha` del bloque y "Mostrar por". Pedido solo con `tip_cod`/`cod_rel` el backend no devuelve
   * filas; una página vacía llega como 500 y se muestra como tabla vacía.
   */
  gestionDetalle(nodo: NodoConsulta, ver: number, pagina = 1): Observable<TablaReporteResultado> {
    return this.bloques.regularPaginadoTolerante(COD_PORTAFOLIO_REASIGNADO.gestionDetalle, nodo, { fecha: this.bloques.fec(), ver }, pagina);
  }

  /** Resumen de Monitor Efectividades Reasignados. */
  monitorResumen(nodo: NodoConsulta): Observable<TablaReporteResultado> {
    return this.bloqueConFecha(COD_PORTAFOLIO_REASIGNADO.monitorResumen, nodo);
  }

  /**
   * Detalle de Monitor Efectividades Reasignados (`_02` de `cra-v12`): paginado, con el nodo
   * COMPLETO de la jerarquía y sus filtros (`pagen` viene en `extra`), como el legado.
   */
  monitorDetalle(nodo: NodoConsulta, extra: Record<string, unknown>): Observable<TablaReporteResultado> {
    const pagina = Number(extra['pagen'] ?? 1);
    return this.bloques.regularPaginadoTolerante(COD_PORTAFOLIO_REASIGNADO.monitorDetalle, nodo, { fecha: this.bloques.fec(), ...extra }, pagina);
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
