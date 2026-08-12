import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../ant/ant-service.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/** Módulo de Ranking Kaypacha del backend Ant (puerto 6302, appId `app`). */
@Injectable({ providedIn: 'root' })
export class ModKaypachaService extends AntService {
  constructor() {
    super({
      port: 6302,
      secret: environment.moduleSecrets.app,
      appId: 'app',
    });
  }

  /**
   * Lista de categorías del ranking (tabla "Principal" del legado).
   *
   * @param codBT Código de negocio/agencia opcional — el backend usa el del usuario si se omite.
   */
  public getListRanking(codBT?: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('kaypacha.listRanking', { cod_bt: codBT }, 'resultado');
  }

  /**
   * Desglose del ranking de una categoría puntual.
   *
   * @param rdestip Identificador de la categoría (`rdestip` de la fila elegida en `getListRanking`).
   *   El backend recibe este valor bajo la clave `cod_bt`, igual que el legado — no es
   *   literalmente un código de agencia en esta ruta, es como el backend identifica la categoría.
   */
  public getDetalleRanking(rdestip: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('kaypacha.DetalleRanking', { cod_bt: rdestip }, 'resultado');
  }

  /**
   * Obtiene la información detallada del colaborador para el tablero Kaypacha (puntos acumulados y variables históricas).
   */
  public getColaboradoresData(codBT?: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('kaypacha.colaboradoresData', { cod_bt: codBT }, 'resultado');
  }

  /**
   * Obtiene la lista global de colaboradores para el buscador de Kaypacha.
   */
  public getUserLists(): Observable<IWinderResponse> {
    return this.getSimpleResponseString('kaypacha.colaboradores', {}, 'resultado');
  }
}
