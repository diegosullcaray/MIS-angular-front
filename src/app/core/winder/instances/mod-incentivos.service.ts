import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../ant/ant-service.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/**
 * ModIncentivosService — Módulo "Incentivos" del backend Ant.
 *
 * | Parámetro | Valor  |
 * |-----------|--------|
 * | Port      | 6302   |
 * | AppId     | app    |
 * | Secret    | `environment.moduleSecrets.app` |
 *
 * Mismo port/secret/appId que `ModPresupuestoService`/`ModFrameworkEsgService`/
 * `ModDashboardService` — el legado `ModIncentivos3Service`
 * (`pages/modules/incentivos3/compartido/servicios/mod-incentivos3.service.ts`
 * del repo STG) se conecta idéntico.
 *
 * El motor de cálculo real vive en el namespace de backend `incentivos4.*`
 * (`getDataSources*`/`calcular*`) — el namespace `incentivos3.*` que le da
 * nombre al módulo Angular legado solo cubre las pantallas de detalle
 * (`getDetail`/`getTasa`/`getProd`/`getCliBanc`) y el listado de niveles del
 * selector de jerarquía (`getFromHierList`). Ver
 * `docs/06-legado-sistema-anterior/incentivos-auditoria.md`.
 *
 * Migrado del STG (stg-app-mis-r22, `ModIncentivos3Service`).
 */
@Injectable({ providedIn: 'root' })
export class ModIncentivosService extends AntService {
  constructor() {
    super({
      port: 6302,
      secret: environment.moduleSecrets.app,
      appId: 'app',
    });
  }

  /** Niveles alcanzables desde el nodo actual (Unidades/Corredores/Territorios) — selector de jerarquía. */
  public getFromHierList(tipCod: number, codRel: string, tipCodL: number): Observable<IWinderResponse> {
    return this.getSimpleResponseString(
      'incentivos3.lista3',
      { tip_cod: tipCod, cod_rel: codRel, tip_cod_l: tipCodL },
      'resultado'
    );
  }

  /** Datos del Cuadro de Mando para un usuario/nodo individual (`cla_usu===1`). */
  public getDataSourcesIndividual(
    model: string,
    tipCod: number,
    codRel: string,
    fec: string
  ): Observable<IWinderResponse> {
    return this.getSimpleResponseString(
      'incentivos4.resultados4',
      { model, tip_cod: tipCod, cod_rel: codRel, fec },
      'resultado'
    );
  }

  /** Datos del Cuadro de Mando para un nodo grupal (`cla_usu===2`) — sin parámetro `model`. */
  public getDataSourcesGrupal(tipCod: number, codRel: string, fec: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('incentivos4.resultados5', { tip_cod: tipCod, cod_rel: codRel, fec }, 'resultado');
  }

  /** Simulación de la calculadora para un nodo individual. */
  public calcularIndividual(model: string, params: unknown, fec: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString(
      'incentivos4.calculadora4',
      { model, params: JSON.stringify(params), fec },
      'resultado'
    );
  }

  /** Simulación de la calculadora para un nodo grupal — sin parámetro `model`. */
  public calcularGrupal(params: unknown, fec: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('incentivos4.calculadora5', { params: JSON.stringify(params), fec }, 'resultado');
  }

  public getDetail(tipCod: number, codRel: string, codVar: number, fec: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString(
      'incentivos3.detalle_var3',
      { tip_cod: tipCod, cod_rel: codRel, cod_var: codVar, fec },
      'resultado'
    );
  }

  public getTasa(tipCod: number, codRel: string, fec: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('incentivos3.tasas3', { tip_cod: tipCod, cod_rel: codRel, fec }, 'resultado');
  }

  public getProd(tipCod: number, codRel: string, fec: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('incentivos3.productividad3', { tip_cod: tipCod, cod_rel: codRel, fec }, 'resultado');
  }

  public getCliBanc(tipCod: number, codRel: string, fec: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('incentivos3.bancarizados3', { tip_cod: tipCod, cod_rel: codRel, fec }, 'resultado');
  }

  public getRetencion(tipCod: number, codRel: string, fec: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('incentivos4.retencion4', { tip_cod: tipCod, cod_rel: codRel, fec }, 'resultado');
  }
}
