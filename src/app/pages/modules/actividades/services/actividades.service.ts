import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../../../../core/winder/ant/ant-service.class';
import { environment } from '../../../../../environments/environment';
import type { IWinderResponse } from '../../../../core/winder/winder/winder.interface';
import { ShellStateService } from '../../../../core/services/shell-state.service';

/** ActividadesService — Servicio Winder de comunicación con el backend Ant (puerto 6302, app) para el módulo de Actividades (Destino de Crédito, Registro de Prospectos y Transacciones). */
@Injectable({ providedIn: 'root' })
export class ActividadesService extends AntService {
  private readonly shell = inject(ShellStateService);

  constructor() {
    super({
      port: 6302,
      secret: environment.moduleSecrets.app,
      appId: 'app',
    });
  }

  /** Código de negocio/agencia del usuario de sesión activo. */
  public get userCodBt(): string {
    return this.shell.usuarioActivo()?.codBt ?? '';
  }

  /** Obtiene la lista de seguimiento de Destino de Crédito. */
  public getRegResultadosDestCred(codBT?: string): Observable<IWinderResponse> {
    const bt = codBT || this.userCodBt;
    return this.getSimpleResponseString('actividades.get_dest_cre', { cod_bt: bt }, 'resultado');
  }

  /** Actualiza el registro de resultado de Destino de Crédito. */
  public postRegResultadosDestCred(ov: unknown): Observable<unknown> {
    const params = { ov_json: JSON.stringify(ov) };
    return this.postSimpleResponseString('actividades.post_dest_cre', params);
  }

  /** Obtiene la lista de prospectos y transacciones de corresponsales. */
  public getRegResultadosListProsp(codBT?: string): Observable<IWinderResponse> {
    const bt = codBT || this.userCodBt;
    return this.getSimpleResponseString('corresponsal.get_list_prosp', { cod_bt: bt }, 'resultado');
  }

  /** Registra / actualiza la información de un prospecto corresponsal. */
  public postRegResultadosProsp(ov: unknown): Observable<unknown> {
    const params = { ov_json: JSON.stringify(ov) };
    return this.postSimpleResponseString('corresponsal.post_reg_prosp', params);
  }
}
