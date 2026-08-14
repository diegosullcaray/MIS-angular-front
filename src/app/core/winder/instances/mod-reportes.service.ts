import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../ant/ant-service.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/**
 * Módulo de Reporting del backend Ant (puerto 5304, appId `reporting`).
 *
 * `table.regular` y `regularData` son motores **distintos** pese al nombre
 * parecido: el primero devuelve una tabla genérica (lo usa Herramientas), el
 * segundo el motor de reportes "mixtos" (tablas multi-encabezado + tarjetas KPI).
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

  /**
   * Variante "deprecada" del motor de reportes "mixtos" (strand `reportData`
   * en vez de `regularData`) — el propio legado la marca como obsoleta
   * (`ComercialService.getReportData()`: "está usando un método depreciado")
   * pero algunos reportes todavía no fueron migrados a `regularData` del
   * lado del backend (ej. "Cartera", `rda/sectorista/cartera/cartera_sec`).
   * Misma forma de respuesta (`result.headers`/`body`/`additional`).
   */
  public getDeprecatedData(codRep: string, params: Record<string, unknown>): Observable<IWinderResponse> {
    return this.getSimpleResponseString('reportData', { ...params, cod_rep: codRep }, 'result');
  }
}
