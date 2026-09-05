import { HttpContext } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../ant/ant-service.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/** Módulo de Reporting del backend Ant (puerto 5304, appId `reporting`). */
@Injectable({ providedIn: 'root' })
export class ModReportesService extends AntService {
  constructor() {
    super({
      port: 5304,
      secret: environment.moduleSecrets.reporting,
      appId: 'reporting',
    });
  }

  /** Resultado de una tabla genérica del motor de reportes. */
  public getRegularTableResult(codRep: string, params: Record<string, unknown>, context?: HttpContext): Observable<IWinderResponse> {
    return this.getSimpleResponseString('table.regular', { ...params, cod_rep: codRep }, 'resultado', context);
  }

  /** Resultado de un bloque del motor de reportes "mixtos". */
  public getRegularData(
    codRep: string,
    params: Record<string, unknown>,
    context?: HttpContext
  ): Observable<IWinderResponse> {
    return this.getSimpleResponseString('regularData', { ...params, cod_rep: codRep }, 'result', context);
  }

  /** Variante obsoleta del motor de reportes mixtos (strand `reportData`). */
  public getDeprecatedData(codRep: string, params: Record<string, unknown>): Observable<IWinderResponse> {
    return this.getSimpleResponseString('reportData', { ...params, cod_rep: codRep }, 'result');
  }

  /** Bloques de gráfico del motor de reportes mixtos. */
  public getGraphicData(codRep: string, params: Record<string, unknown>): Observable<IWinderResponse> {
    return this.getSimpleResponseString('graphicData', { ...params, cod_rep: codRep }, 'result');
  }
}
