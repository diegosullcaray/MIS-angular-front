import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../../../services/bloque-reporte.service';
import type { ReporteBloqueUnico } from '../../../../../models/tabla-reporte.model';
import { COD_APLICATIVO_MOVIL } from '../constantes/aplicativo-movil.constantes';

/** El único reporte de "Aplicativo Móvil". */
@Injectable({ providedIn: 'root' })
export class AplicativoMovilService {
  private readonly bloques = inject(BloqueReporteService);

  /**
   * "Uso de App" — legado `app_uso` (`APP_USO_01`, host `cra-v1p1`, jerarquía `UNI_1`).
   *
   * Su entrada de `cra-map.ts` NO declara `params`, así que el host manda solo
   * `{ ...getParamsAdd() = {}, ...filter = {}, ...level }`: `tip_cod` y
   * `cod_rel` y nada más. De ahí el `regularExacto()` — el `fec` que agrega
   * `regular()` por su cuenta no corresponde acá.
   */
  usoApp(nodo: NodoConsulta): Observable<ReporteBloqueUnico> {
    return this.bloques.regularExacto(COD_APLICATIVO_MOVIL.usoApp, nodo).pipe(map((tabla1) => ({ tabla1 })));
  }
}
