import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import type { TablaDinamicaResultado } from '../../../../../models/tabla-dinamica.model';
import type { OpcionFiltro } from '../../../../../models/filtros.model';
import { TODO } from '../models/portafolio-reasignado.model';

/**
 * Los tres reportes de Portafolio Reasignado.
 *
 * "Gestión de Cartera Reasignada" y "Monitor Efectividades Reasignados" salen
 * de los hosts `cra-v11`/`cra-v12`, que resuelven su configuración con
 * `com-map.module.ts` (no con el `cra-map.ts` del resto) y piden los bloques
 * por el strand `regularData`. "Efectividad de Cartera Reasignada" vive en el
 * repositorio y va por `table.regular`.
 */
@Injectable({ providedIn: 'root' })
export class PortafolioReasignadoService {
  private readonly bloques = inject(BloqueReporteService);

  /** "Efectividad por tramos" — legado `repositorio/reasignado` (`RS_MON_EFECREASIG_03`). */
  efectividadPorTramos(nodo: NodoConsulta, imp: number): Observable<TablaDinamicaResultado> {
    return this.bloques.tablaRegularCon('RS_MON_EFECREASIG_03', {
      tip_cod: nodo.tip_cod,
      cod_rel: nodo.cod_rel,
      fec: this.bloques.fecha(),
      imp,
    });
  }

  /** Resumen de "Gestión de Cartera Reasignada" — `RS_AGE_COM_CR_01`, con el filtro `ver`. */
  gestionResumen(nodo: NodoConsulta, ver: number): Observable<TablaReporteResultado> {
    return this.bloqueConFecha('RS_AGE_COM_CR_01', nodo, { ver });
  }

  /**
   * Detalle de "Gestión de Cartera Reasignada".
   *
   * Ojo: el host pide el bloque `_03` aunque la segunda entrada de
   * `com-map.module.ts` esté declarada como `_02` — el `id` del mapa solo
   * elige la configuración de la tabla, el `cod_rep` lo arma aparte.
   */
  gestionDetalle(nodo: NodoConsulta, ver: number, extra: Record<string, unknown>): Observable<TablaReporteResultado> {
    return this.bloqueConFecha('RS_AGE_COM_CR_03', nodo, { ver, ...extra });
  }

  /** Resumen de "Monitor Efectividades Reasignados" — `RS_MON_EFECREASIG_01`, sin filtros propios. */
  monitorResumen(nodo: NodoConsulta): Observable<TablaReporteResultado> {
    return this.bloqueConFecha('RS_MON_EFECREASIG_01', nodo);
  }

  /** Detalle de "Monitor Efectividades Reasignados" — `RS_MON_EFECREASIG_02`, con sus seis filtros. */
  monitorDetalle(nodo: NodoConsulta, extra: Record<string, unknown>): Observable<TablaReporteResultado> {
    return this.bloqueConFecha('RS_MON_EFECREASIG_02', nodo, extra);
  }

  /** Opciones de "Última Gestión": el legado las trae del propio backend (`SEL_EFEC_01`). */
  opcionesUltimaGestion(): Observable<OpcionFiltro[]> {
    return this.bloques.regular('SEL_EFEC_01', { tip_cod: 0, cod_rel: '' }).pipe(
      map((tabla) => [
        { id: TODO, desc: 'TODO' },
        ...tabla.body.map((fila) => ({ id: String(fila['id'] ?? ''), desc: String(fila['desc'] ?? fila['id'] ?? '') })),
      ]),
    );
  }

  /** Estos bloques declaran su corte como `fecha`, no como el `fec` que agrega `BloqueReporteService`. */
  private bloqueConFecha(
    codRep: string,
    nodo: NodoConsulta,
    extra: Record<string, unknown> = {},
  ): Observable<TablaReporteResultado> {
    return this.bloques.regular(codRep, nodo, { fecha: this.bloques.fec(), ...extra });
  }
}
