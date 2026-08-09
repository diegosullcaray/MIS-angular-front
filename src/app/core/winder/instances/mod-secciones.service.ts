import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../ant/ant-service.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/**
 * ModSeccionesService — Módulo "Secciones" del backend Ant.
 *
 * | Parámetro | Valor      |
 * |-----------|------------|
 * | Port      | 5301       |
 * | AppId     | secciones  |
 * | Secret    | `environment.moduleSecrets.secciones` |
 *
 * Migrado del STG (`docs/07-modulos/analista/compartido/servicios/mod-sec.service.ts`,
 * `ModSecService`) — acá solo se porta la ruta que usa Categorización
 * (`categorizacion.detalle`). El resto de rutas del legado (dashboard,
 * listas de prospectos/becas, detalle de cliente) pertenecen a otras
 * pantallas de "analista" que no forman parte de esta migración.
 */
@Injectable({ providedIn: 'root' })
export class ModSeccionesService extends AntService {
  constructor() {
    super({
      port: 5301,
      secret: environment.moduleSecrets.secciones,
      appId: 'secciones',
    });
  }

  public getDetalleCategorizacion(codBt: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('categorizacion.detalle', { cod_bt: codBt }, 'resultado');
  }
}
