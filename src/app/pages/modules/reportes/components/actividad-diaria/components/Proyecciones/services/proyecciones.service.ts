import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import { COD_PROYECCIONES } from '../constantes/proyecciones.constantes';

/**
 * Los dos reportes de "Proyecciones".
 *
 * Se parecen pero no comparten infraestructura:
 *
 * - "Proyección colocación" (`PROYEC_COLREC`) cuelga del host `report-cra-v11`,
 *   que llama `cs.getRegularData()` directamente: va por `regularData` aunque
 *   su entrada de `com-map.module.ts` tenga el `reportType` comentado. El
 *   `reportType` del mapa solo lo miran los hosts que usan `getMixData`.
 *   Ese host tampoco agrega `fec`, de ahí el `regularExacto()`.
 * - Sus ids además no son correlativos: declara `_01` y `_03` (no hay `_02`),
 *   el mismo patrón que `RS_AGE_COM_CR` en Portafolio Reasignado.
 */
@Injectable({ providedIn: 'root' })
export class ProyeccionesService {
  private readonly bloques = inject(BloqueReporteService);

  /**
   * "Proyección colocación" — legado `proy_M1` (`PROYEC_COLREC`, host `cra-v11`).
   *
   * Va por `regularLento()`: mueve bastante data y no entraba en los 30 s del
   * timeout global, y además el backend contesta 500
   * (`NullPointerException: Resultado vacio para: regularData`) cuando un bloque
   * no devuelve filas. Dentro del `forkJoin` eso tumbaba el reporte entero; así
   * el bloque sin datos queda como tabla vacía —la tabla ya pinta "Sin datos
   * para mostrar"— y el otro se ve igual.
   */
  colocacion(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    const fec = this.bloques.fec();
    return forkJoin([
      this.bloques.regularLento(COD_PROYECCIONES.colocacionConFecha, nodo, { fec }),
      this.bloques.regularLento(COD_PROYECCIONES.colocacionSinFecha, nodo),
    ]);
  }

  /** "Proyección diaria colocación" — legado `proy_M2` (`PROYEC_DIACOLREC`), sin parámetros propios. */
  diariaColocacion(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      COD_PROYECCIONES.diariaColocacion.map((codRep) => ({ codRep })),
      nodo,
    );
  }
}
