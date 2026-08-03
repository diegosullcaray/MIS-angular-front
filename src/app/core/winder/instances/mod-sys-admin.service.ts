import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../ant/ant-service.class';
import { Strand } from '../winder/strand.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/**
 * ModSysAdminService — Módulo de Administración del backend Ant.
 *
 * | Parámetro | Valor  |
 * |-----------|--------|
 * | Port      | 6301   |
 * | AppId     | admin  |
 * | Secret    | `environment.moduleSecrets.admin` |
 *
 * Rutas disponibles en el backend:
 * - `list_sec`       → lista de secciones/menús del usuario.
 * - `base_hier`      → nivel/TipCod/CodRel base de la jerarquía del usuario.
 * - `level_hier`     → detalle de un nivel jerárquico.
 * - `list_pick_01`   → lista de sectoristas.
 * - `reg_track_info` → registra el tracking de navegación.
 *
 * Migrado del STG (stg-app-mis-r22/src/app/core/data/remote/instances/mod-sys-admin.service.ts).
 */
@Injectable({ providedIn: 'root' })
export class ModSysAdminService extends AntService {
  constructor() {
    super({
      port: 6301,
      secret: environment.moduleSecrets.admin,
      appId: 'admin',
    });
  }

  /**
   * Lista de secciones (ítems de menú) habilitadas para el usuario.
   *
   * @param email Email corporativo del usuario autenticado.
   */
  public getMenuItems(email: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('list_sec', { email }, 'menu_response');
  }

  /**
   * Nivel base, TipCod y CodRel de la jerarquía solicitada para el usuario.
   *
   * @param email          Email del usuario.
   * @param codHierarchy   Código de la jerarquía organizativa.
   */
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

  /**
   * Detalle del nivel de jerarquía pedido para el TipCod y CodRel raíz.
   *
   * @param codHier   Código de jerarquía.
   * @param lvlHier   Nivel dentro de la jerarquía.
   * @param tipCod    Tipo de código del nodo raíz.
   * @param codRels   Códigos relacionales del nodo raíz.
   * @param params    Parámetros adicionales opcionales.
   */
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

  /**
   * Lista de sectoristas filtrada por tipo y código relacional.
   *
   * @param tipCod  Tipo de código.
   * @param codRel  Código relacional.
   */
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

  /**
   * Registra el tracking de la ruta visitada por el usuario.
   *
   * @param reg JSON serializado con la información de navegación.
   */
  public postRouteTrack(reg: string): Observable<unknown> {
    const s = new Strand('reg_track_info', 'res');
    s.pushToPayload('reg_json', reg);
    return this.postResponseString(s);
  }
}
