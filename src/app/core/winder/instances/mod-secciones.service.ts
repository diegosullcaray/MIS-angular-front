import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AntService } from '../ant/ant-service.class';
import { environment } from '../../../../environments/environment';
import type { IWinderResponse } from '../winder/winder.interface';

/** Módulo "Secciones" del backend Ant (puerto 5301, appId `secciones`). Cubre las rutas que usan Categorización y Analista (Principal/Listas). */
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

  // ─── Encuesta Clientes ────────────────────────────────────────────────────

  /** Lista de asesores/sectoristas visibles para el usuario logueado (`email`) — legado `ModSecService.getSecList()`. */
  public getSecList(email: string): Observable<IWinderResponse> {
    return this.getSimpleResponseString('sec_list2', { email }, 'result_sectorista');
  }

  /** Actualiza un reporte del motor "mixto" (`cod_rep`) — legado `ModSecService.updateData()`. */
  public postRegularUpdate(codRep: string, params: Record<string, unknown>): Observable<IWinderResponse> {
    return this.getSimpleResponseString('regularUpdate', { ...params, cod_rep: codRep }, 'result');
  }
}
