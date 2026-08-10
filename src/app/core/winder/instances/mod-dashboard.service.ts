import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../ant/ant-service.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/**
 * ModDashboardService — Módulo "Dashboards Integrados" (`reportes2`) del
 * backend Ant.
 *
 * | Parámetro | Valor  |
 * |-----------|--------|
 * | Port      | 6302   |
 * | AppId     | app    |
 * | Secret    | `environment.moduleSecrets.app` |
 *
 * Mismo port/secret/appId que `ModPresupuestoService`/`ModFrameworkEsgService`
 * — el legado `ModReportesEService`
 * (`pages/modules/reportes-e/compartido/servicios/mod-reportes-e.service.ts`
 * del repo STG) se conecta idéntico. Distinto de `ModReportesService`
 * (puerto 5304, appId `reporting`, usado por Herramientas) — a pesar del
 * nombre similar, son dos módulos de negocio distintos en el backend.
 *
 * Migrado del STG (stg-app-mis-r22, `ModReportesEService`).
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
