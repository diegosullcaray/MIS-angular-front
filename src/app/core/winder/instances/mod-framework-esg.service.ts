import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../ant/ant-service.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/**
 * ModFrameworkEsgService — Módulo "Framework ESG" del backend Ant.
 *
 * | Parámetro | Valor  |
 * |-----------|--------|
 * | Port      | 6302   |
 * | AppId     | app    |
 * | Secret    | `environment.moduleSecrets.app` |
 *
 * Mismo port/secret/appId que `ModPresupuestoService`/`ModKaypachaService` —
 * el legado `ModFrameworkEsgService`
 * (`docs/06-legado-sistema-anterior` no lo documenta, migrado directo del
 * volcado en `pages/modules/framework-esg/compartido/servicios/mod-framework-esg.service.ts`
 * del repo STG) se conecta idéntico.
 *
 * Migrado del STG (stg-app-mis-r22, `ModFrameworkEsgService`).
 */
@Injectable({ providedIn: 'root' })
export class ModFrameworkEsgService extends AntService {
  constructor() {
    super({
      port: 6302,
      secret: environment.moduleSecrets.app,
      appId: 'app',
    });
  }

  public getConfiguracionMod(codBt: string | undefined): Observable<IWinderResponse> {
    return this.getSimpleResponseString('esg.cfg_mod', { cod_bt: codBt }, 'resultado');
  }

  public getResumenPor(): Observable<IWinderResponse> {
    return this.getSimpleResponseStringNP('esg.res_por', 'resultado');
  }

  public getResumenCat(codCat: number, codBt: string | undefined, isAdmin: number): Observable<IWinderResponse> {
    return this.getSimpleResponseString(
      'esg.res_cat',
      { cod_cat: codCat, cod_bt: codBt, is_admin: isAdmin },
      'resultado'
    );
  }

  public postActualizaMet(codBt: string | undefined, codMet: number, cfg: unknown): Observable<unknown> {
    return this.postSimpleResponseString('esg.act_met', {
      cod_bt: codBt,
      cod_met: codMet,
      cfg: JSON.stringify(cfg),
    });
  }

  public getMetUsers(codMet: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('esg.get_users', { cod_met: codMet }, 'resultado');
  }

  public postMetUsers(json: unknown): Observable<unknown> {
    return this.postSimpleResponseString('esg.post_users', { json: JSON.stringify(json) });
  }
}
