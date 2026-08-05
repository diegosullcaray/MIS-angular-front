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
 * Ruta disponible en el backend usada por Herramientas (`cons_base_negativa`):
 * - `table.regular` → resultado de una tabla genérica (`cod_rep` + parámetros
 *   propios de cada reporte), igual que `getRegularTableResult` del legado.
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
}
