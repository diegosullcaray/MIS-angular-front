import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../ant/ant-service.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/**
 * ModReportesService — Módulo de Reporting del backend Ant (`ModRepService`
 * del legado, `stg-fuente/.../reportes/compartido/servicios/mod-rep.service.ts`).
 *
 * | Parámetro | Valor        |
 * |-----------|--------------|
 * | Port      | 5304         |
 * | AppId     | reporting    |
 * | Secret    | `environment.moduleSecrets.reporting` |
 *
 * Rutas disponibles en el backend:
 * - `table.regular` → resultado de una tabla genérica (`cod_rep` + parámetros
 *   propios de cada reporte), usada por Herramientas (`cons_base_negativa`),
 *   igual que `getRegularTableResult` del legado (`ModRepService` en
 *   `reportes/compartido/servicios/mod-rep.service.ts`).
 * - `regularData` → motor de reportes "mixtos" (tablas multi-encabezado +
 *   tarjetas KPI) usado por Reportes/Avance Comercial, igual que
 *   `ReportType.REGULAR` + `getData()`/`getMixData()` del legado
 *   (`reportes/legacy/support/data/ant-mod-rep.service.ts` +
 *   `reportes/legacy/comercial/comercial.service.ts`) — **distinta** de
 *   `table.regular`, aunque el nombre se preste a confusión.
 */
@Injectable({ providedIn: 'root' })
export class ModReportesService extends AntService {
  constructor() {
    super({
      port: 5304,
      secret: environment.moduleSecrets.reporting,
      appId: 'reporting',
    });
  }

  /**
   * Resultado de una tabla genérica del motor de reportes.
   *
   * @param codRep Código del reporte (`cod_rep`, ej: `'RS_BASE_NEG_01'`).
   * @param params Parámetros propios del reporte (ej: `{ nom: termino }`).
   */
  public getRegularTableResult(codRep: string, params: Record<string, unknown>): Observable<IWinderResponse> {
    return this.getSimpleResponseString('table.regular', { ...params, cod_rep: codRep }, 'resultado');
  }

  /**
   * Resultado de un bloque del motor de reportes "mixtos" (tabla
   * multi-encabezado o tarjeta KPI, según el `cod_rep`) — cada bloque de un
   * reporte tiene su propio `cod_rep` (ej. `Monitor_Dese_01`, `Monitor_Dese_02`),
   * igual que `getRNameCompleted()` armaba `nombre + sufijo` en el legado.
   *
   * @param codRep Código del bloque del reporte (`cod_rep`, ej: `'Monitor_Dese_01'`).
   * @param params Parámetros propios del bloque + jerarquía elegida (`tip_cod`/`cod_rel`).
   */
  public getRegularData(codRep: string, params: Record<string, unknown>): Observable<IWinderResponse> {
    return this.getSimpleResponseString('regularData', { ...params, cod_rep: codRep }, 'result');
  }
}
