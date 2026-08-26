import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../ant/ant-service.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/**
 * Módulo de Reporting v2 del backend Ant (puerto 6304, appId `rep2`).
 *
 * Es un módulo aparte del `reporting` (5304): tiene su propio puerto y secreto.
 * Lo usan los dos monitores del repositorio que el legado resolvía con su
 * propio `AntService`: "Monitor Salidas y Retenciones"
 * (`repositorio/mon-salidas`, `MonSalidasAntService`) y "Monitor IMR"
 * (`repositorio/mon-imr`, `MonImrAntService`).
 */
@Injectable({ providedIn: 'root' })
export class ModRep2Service extends AntService {
  constructor() {
    super({
      port: 6304,
      secret: environment.moduleSecrets.rep2,
      appId: 'rep2',
    });
  }

  /** Tarjetas y tabla del nivel elegido (`mon_sali_ret.resultados`). */
  public getMonSalidasResultados(params: Record<string, unknown>): Observable<IWinderResponse> {
    return this.getSimpleResponseString('mon_sali_ret.resultados', params, 'resultado');
  }

  /** Listado de clientes detrás de una tarjeta o celda (`mon_sali_ret.detalle`). */
  public getMonSalidasDetalle(params: Record<string, unknown>): Observable<IWinderResponse> {
    return this.getSimpleResponseString('mon_sali_ret.detalle', params, 'resultado');
  }

  /** Tarjetas, tabla y encabezados del nivel elegido (`mon_imr.resultados`). */
  public getMonImrResultados(params: Record<string, unknown>): Observable<IWinderResponse> {
    return this.getSimpleResponseString('mon_imr.resultados', params, 'resultado');
  }

  /** Listado de clientes detrás de una tarjeta o celda de Monitor IMR (`mon_imr.detalle`). */
  public getMonImrDetalle(params: Record<string, unknown>): Observable<IWinderResponse> {
    return this.getSimpleResponseString('mon_imr.detalle', params, 'resultado');
  }
}
