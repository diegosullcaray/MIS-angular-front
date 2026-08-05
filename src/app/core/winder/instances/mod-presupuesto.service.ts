import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../ant/ant-service.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/**
 * ModPresupuestoService — Módulo de Presupuesto del backend Ant.
 *
 * | Parámetro | Valor  |
 * |-----------|--------|
 * | Port      | 6302   |
 * | AppId     | app    |
 * | Secret    | `environment.moduleSecrets.app` |
 *
 * Mismo port/secret/appId que `ModKaypachaService` — el legado
 * `ModBudgetService` (`docs/07-modulos/presupuesto/compartido/servicios/mod-budget.service.ts`)
 * se conecta idéntico.
 *
 * Migrado del STG (stg-app-mis-r22, `ModBudgetService`).
 */
@Injectable({ providedIn: 'root' })
export class ModPresupuestoService extends AntService {
  constructor() {
    super({
      port: 6302,
      secret: environment.moduleSecrets.app,
      appId: 'app',
    });
  }

  // ─── Responsables ──────────────────────────────────────────────────────────

  public getRegResultados(tipCod: number): Observable<IWinderResponse> {
    return this.getSimpleResponseString('presupuesto.get_reg_res', { tip_cod: tipCod }, 'resultado');
  }

  public postRegResultados(codBt: string | undefined, filas: unknown[]): Observable<unknown> {
    return this.postSimpleResponseString('presupuesto.post_reg_res', {
      cod_bt: codBt,
      ov_json: JSON.stringify(filas),
    });
  }

  // ─── Tablero de verificación ────────────────────────────────────────────────

  public getLogVerificaciones(tipCod: number, codSec: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString(
      'presupuesto.get_log_ver',
      { tip_cod: tipCod, cod_sec: codSec },
      'resultado'
    );
  }

  public postLogVerificaciones(
    codBt: string | undefined,
    tipCod: number,
    codRel: string,
    codSec: string
  ): Observable<unknown> {
    return this.postSimpleResponseString('presupuesto.post_log_ver', {
      cod_bt: codBt,
      tip_cod: tipCod,
      cod_rel: codRel,
      cod_sec: codSec,
    });
  }

  // ─── Cartera de créditos ─────────────────────────────────────────────────────

  public getResCarCreditos(email: string, tipCod: number, codRel: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString(
      'presupuesto.get_car_cre',
      { email, tip_cod: tipCod, cod_rel: codRel },
      'resumen'
    );
  }

  public postResCarCreditos(
    codBt: string | undefined,
    tipCod: number,
    codRel: string,
    filas: unknown[]
  ): Observable<unknown> {
    return this.postSimpleResponseString('presupuesto.post_car_cre', {
      cod_bt: codBt,
      tip_cod: tipCod,
      cod_rel: codRel,
      ov_json: JSON.stringify(filas),
    });
  }

  // ─── Depósitos Red ───────────────────────────────────────────────────────────

  public getResDepRed(email: string, tipCod: number, codRel: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString(
      'presupuesto.get_dep_red',
      { email, tip_cod: tipCod, cod_rel: codRel },
      'resumen'
    );
  }

  public postResDepRed(
    codBt: string | undefined,
    tipCod: number,
    codRel: string,
    filas: unknown[]
  ): Observable<unknown> {
    return this.postSimpleResponseString('presupuesto.post_dep_red', {
      cod_bt: codBt,
      tip_cod: tipCod,
      cod_rel: codRel,
      ov_json: JSON.stringify(filas),
    });
  }

  // ─── Depósitos Banca Preferente ──────────────────────────────────────────────

  public getResDepBP(email: string, tipCod: number, codRel: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString(
      'presupuesto.get_dep_bp',
      { email, tip_cod: tipCod, cod_rel: codRel },
      'resumen'
    );
  }

  public postResDepBP(
    codBt: string | undefined,
    tipCod: number,
    codRel: string,
    filas: unknown[]
  ): Observable<unknown> {
    return this.postSimpleResponseString('presupuesto.post_dep_bp', {
      cod_bt: codBt,
      tip_cod: tipCod,
      cod_rel: codRel,
      ov_json: JSON.stringify(filas),
    });
  }

  // ─── Seguros Comercial ───────────────────────────────────────────────────────

  public getResSegComercial(email: string, tipCod: number, codRel: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString(
      'presupuesto.get_seg_com',
      { email, tip_cod: tipCod, cod_rel: codRel },
      'resumen'
    );
  }

  public postResSegComercial(
    codBt: string | undefined,
    tipCod: number,
    codRel: string,
    filas: unknown[]
  ): Observable<unknown> {
    return this.postSimpleResponseString('presupuesto.post_seg_com', {
      cod_bt: codBt,
      tip_cod: tipCod,
      cod_rel: codRel,
      ov_json: JSON.stringify(filas),
    });
  }

  // ─── Seguros Operaciones ─────────────────────────────────────────────────────

  public getResSegOperaciones(email: string, tipCod: number, codRel: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString(
      'presupuesto.get_seg_ope',
      { email, tip_cod: tipCod, cod_rel: codRel },
      'resumen'
    );
  }

  public postResSegOperaciones(
    codBt: string | undefined,
    tipCod: number,
    codRel: string,
    filas: unknown[]
  ): Observable<unknown> {
    return this.postSimpleResponseString('presupuesto.post_seg_ope', {
      cod_bt: codBt,
      tip_cod: tipCod,
      cod_rel: codRel,
      ov_json: JSON.stringify(filas),
    });
  }
}
