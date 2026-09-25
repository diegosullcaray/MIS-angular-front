import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, throwError } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import { TABLA_VACIA, type TablaReporteResultado } from '../../../../../models/tabla-reporte.model';
import { esBloqueVacio } from '../../../../../utils/error-bloque.util';
import { COD_PROYECCIONES } from '../constantes/proyecciones.constantes';

/** Servicios para reportes de Proyecciones. */
@Injectable({ providedIn: 'root' })
export class ProyeccionesService {
  private readonly bloques = inject(BloqueReporteService);

  /**
   * Proyección de Colocación · Resumen (`PROYEC_COLREC_01`, pestaña "Resumen" de `cra-v11`): lleva
   * `fec`, como declara el mapa. Mueve mucha data y puede volver vacío, así que tolera el 500.
   */
  colocacionResumen(nodo: NodoConsulta): Observable<TablaReporteResultado> {
    return this.bloques.regularLento(COD_PROYECCIONES.colocacionConFecha, nodo, { fec: this.bloques.fec() });
  }

  /**
   * Proyección de Colocación · Detalle (`PROYEC_COLREC_03`, pestaña "Detalle" de `cra-v11`).
   *
   * El legado lo pide como tabla paginada (`theme_tb3` + `app-table-ajax`, `rendererSync()`): con
   * `pagen` y el NODO COMPLETO de la jerarquía, sin `fec`. Pedido solo con `tip_cod`/`cod_rel` el
   * backend responde 500 ("Resultado vacio para: regularData"). Una página sin filas también llega
   * como ese 500: se trata como tabla vacía; cualquier otro error se propaga.
   */
  colocacionDetalle(nodo: NodoConsulta, pagina = 1): Observable<TablaReporteResultado> {
    return this.bloques
      .regularPaginado(COD_PROYECCIONES.colocacionSinFecha, nodo, {}, pagina)
      .pipe(catchError((e: unknown) => (esBloqueVacio(e) ? of(TABLA_VACIA) : throwError(() => e))));
  }

  /** Reporte de Proyección Diaria de Colocación. */
  diariaColocacion(nodo: NodoConsulta): Observable<TablaReporteResultado[]> {
    return this.bloques.regulares(
      COD_PROYECCIONES.diariaColocacion.map((codRep) => ({ codRep })),
      nodo,
    );
  }
}
