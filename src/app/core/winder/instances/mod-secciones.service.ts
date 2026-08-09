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
 * `ModSecService`) — porta las rutas que usan Categorización y Analista
 * (Principal/Listas). No incluye `dashboard.cliente` con `pais` como ruta
 * de detalle propia de "prospecto" (`docs/.../analista/prospecto`), fuera
 * del alcance de esta migración.
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

  // ─── Categorización ──────────────────────────────────────────────────────

  public getDetalleCategorizacion(codBt: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('categorizacion.detalle', { cod_bt: codBt }, 'resultado');
  }

  // ─── Analista — Principal (dashboard) ────────────────────────────────────

  public getResumenDashboard(codBt: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('dashboard.resumen', { cod_bt: codBt }, 'resultado');
  }

  public getHistoricoVariable(codBt: string, codVar: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('dashboard.historico', { cod_bt: codBt, cod_var: codVar }, 'resultado');
  }

  public getDetalleCliente(
    codBt: string,
    numDoc: string,
    tipDoc: number,
    pais: number
  ): Observable<IWinderResponse> {
    return this.getSimpleResponseString(
      'dashboard.cliente',
      { cod_bt: codBt, num_doc: numDoc, tip_doc: tipDoc, pais },
      'resultado'
    );
  }

  // ─── Analista — Listas ────────────────────────────────────────────────────

  public getListaPrioLeads(codBt: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('listas.prio_leads', { cod_bt: codBt }, 'resultado');
  }

  public getListaBecas(codBt: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('listas.pro_becas', { cod_bt: codBt }, 'resultado');
  }

  public postProsBecas(codBt: string, numDoc: string, com: string): Observable<unknown> {
    return this.postSimpleResponseString('listas.post_becas', { cod_bt: codBt, num_doc: numDoc, com });
  }
}
