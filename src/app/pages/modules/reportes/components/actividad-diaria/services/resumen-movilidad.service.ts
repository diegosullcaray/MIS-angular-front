import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BloqueReporteService, type NodoConsulta } from '../../../services/bloque-reporte.service';
import { ShellStateService } from '../../../../../../core/services/shell-state.service';
import type { ReporteBloqueUnico } from '../components/Captaciones/models/captaciones.model';
import { COD_RESUMEN_MOVILIDAD, TIP_COD_PERSONA } from '../constantes/resumen-movilidad.constantes';

/** `tip_cod` de la jerarquía de personas — el que usa `cra-v6` para consultar por documento. */
/**
 * Los dos "Resumen de Movilidad".
 *
 * No cuelgan de ningún sub-nodo del menú, así que viven como items directos de
 * "Actividad Diaria" y su service vive acá y no dentro de un módulo.
 *
 * Se parecen en el nombre y en nada más: cada uno sale de un host distinto y
 * eso cambia por completo cómo se piden.
 */
@Injectable({ providedIn: 'root' })
export class ResumenMovilidadService {
  private readonly bloques = inject(BloqueReporteService);
  private readonly shell = inject(ShellStateService);

  /**
   * "Resumen de Movilidad Comercial" — legado `res-mov` (`RESNMOV_01`, host
   * `cra-V10`, jerarquía `UNI_1`).
   *
   * `cra-V10` es el host PAGINADO: manda `pagen` y el nodo completo
   * (`{ ...page, ...filter, ...level }`). Su entrada del mapa no declara
   * `params`, así que no lleva `fec`.
   */
  comercial(nodo: NodoConsulta, pagina = 1): Observable<ReporteBloqueUnico> {
    return this.bloques.regularPaginado(COD_RESUMEN_MOVILIDAD.comercial, nodo, {}, pagina).pipe(map((tabla1) => ({ tabla1 })));
  }

  /**
   * Documento del usuario logueado, que es por quien consulta este reporte.
   *
   * Devuelve `undefined` si el backend no lo mandó en el `profile`: sin él no
   * hay consulta posible y la pantalla lo dice, en vez de pedir datos de otro.
   */
  documentoUsuario(): string | undefined {
    return this.shell.usuarioActivo()?.numDoc;
  }

  /**
   * "Resumen de Movilidad Recuperaciones" — legado `res-mov-rec` (`RESNMOVR_01`,
   * host `cra-v6`).
   *
   * **No usa la jerarquía.** `cra-v6` arma los parámetros del nodo y después los
   * PISA enteros con los del usuario logueado:
   *
   * ```js
   * params = { secuency: '[{"tip_cod":2,"cod_rel":"'+num_doc+'","order":0}]',
   *            tip_cod: 2, cod_rel: num_doc }
   * ```
   *
   * Encima va el `fec` que declara su tabla en el mapa. Por eso este método no
   * recibe nodo: el reporte es siempre el del propio usuario.
   */
  recuperaciones(documento: string): Observable<ReporteBloqueUnico> {
    const params = {
      fec: this.bloques.fec(),
      secuency: JSON.stringify([{ tip_cod: TIP_COD_PERSONA, cod_rel: documento, order: 0 }]),
      tip_cod: TIP_COD_PERSONA,
      cod_rel: documento,
    };
    return this.bloques
      .regularExacto(COD_RESUMEN_MOVILIDAD.recuperaciones, { tip_cod: TIP_COD_PERSONA, cod_rel: documento }, params)
      .pipe(map((tabla1) => ({ tabla1 })));
  }
}
