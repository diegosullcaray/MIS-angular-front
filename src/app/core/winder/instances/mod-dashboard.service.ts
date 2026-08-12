import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../ant/ant-service.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/**
 * Módulo "Dashboards Integrados" (`reportes2`) del backend Ant (puerto 6302,
 * appId `app`). No confundir con `ModReportesService` (puerto 5304, appId
 * `reporting`): pese al nombre parecido son dos módulos de negocio distintos.
 */
@Injectable({ providedIn: 'root' })
export class ModDashboardService extends AntService {
  constructor() {
    super({
      port: 6302,
      secret: environment.moduleSecrets.app,
      appId: 'app',
    });
  }

  public getObjectList(codBt: string | undefined, isAdmin: number): Observable<IWinderResponse> {
    return this.getSimpleResponseString('reportes2.lista', { cod_bt: codBt, is_admin: isAdmin }, 'resultado');
  }

  public getPowerBIReportToken(reportId: string, datasetId: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString(
      'reportes2.pbi_rtoken',
      { report_id: reportId, dataset_id: datasetId },
      'resultado'
    );
  }

  public getObjectUsers(reportId: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('reportes2.usuarios', { report_id: reportId }, 'resultado');
  }

  public postObjectUsers(json: unknown): Observable<unknown> {
    return this.postSimpleResponseString('reportes2.guardar', { json: JSON.stringify(json) });
  }
}
