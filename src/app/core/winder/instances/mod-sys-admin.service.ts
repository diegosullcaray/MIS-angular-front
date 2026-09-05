import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../ant/ant-service.class';
import { Strand } from '../winder/strand.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/** Módulo de Administración del backend Ant (puerto 6301, appId `admin`). */
@Injectable({ providedIn: 'root' })
export class ModSysAdminService extends AntService {
  constructor() {
    super({
      port: 6301,
      secret: environment.moduleSecrets.admin,
      appId: 'admin',
    });
  }

  /** Lista de secciones habilitadas para el usuario. */
  public getMenuItems(email: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('list_sec', { email }, 'menu_response');
  }

  /** Nivel base de la jerarquía para el usuario. */
  public getBaseHierarchy(
    email: string,
    codHierarchy: number
  ): Observable<IWinderResponse> {
    return this.getSimpleResponseString(
      'base_hier',
      { email, cod_jer: codHierarchy },
      'base_hierarchy'
    );
  }

  /** Detalle del nivel de jerarquía para el nodo raíz. */
  public getLevelHierarchy(
    codHier: number,
    lvlHier: number,
    tipCod: number,
    codRels: string[],
    params?: Record<string, unknown>
  ): Observable<IWinderResponse> {
    const s = new Strand('level_hier', 'level_hierarchy');
    s.pushToPayload('cod_jer', codHier);
    s.pushToPayload('lvl_jer', lvlHier);
    s.pushToPayload('tip_cod', tipCod);
    // El backend espera una cadena separada por comas
    const vcr = codRels.join(',');
    s.pushToPayload('cod_rels', vcr);
    if (params) {
      s.pushToPayload('params', JSON.stringify(params));
    }
    return this.getResponseString(s);
  }

  /** Lista de sectoristas filtrada por tipo y código. */
  public getListPick01(
    tipCod: number,
    codRel: string
  ): Observable<IWinderResponse> {
    return this.getSimpleResponseString(
      'list_pick_01',
      { tip_cod: tipCod, cod_rel: codRel },
      'list_res'
    );
  }

  /** Registra el tracking de la ruta visitada. */
  public postRouteTrack(reg: string): Observable<unknown> {
    const s = new Strand('reg_track_info', 'res');
    s.pushToPayload('reg_json', reg);
    return this.postResponseString(s);
  }
}
