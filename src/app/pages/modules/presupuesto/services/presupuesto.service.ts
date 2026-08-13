import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModPresupuestoService } from '../../../../core/winder/instances/mod-presupuesto.service';
import { ModSysAdminService } from '../../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { HierarquiaNodo } from '../models/jerarquia.model';
import type { ResumenLineaSimple } from '../models/linea-simple.model';
import type { FilaDeposito } from '../models/deposito.model';
import type { FilaSegurosComercial } from '../models/seguros-comercial.model';
import type { FilaSegurosOperaciones } from '../models/seguros-operaciones.model';
import type { FilaCarteraCreditosVariables, ResumenCarteraCreditos } from '../models/cartera-creditos.model';
import type { LogVerificacionFila } from '../models/tablero-verificacion.model';
import type { ResponsableFila } from '../models/responsables.model';
import type { JerarquiaResponseBody, ListaResponseBody, ResumenResponseBody } from '../models/presupuesto-api.model';

/**
 * Fachada del módulo `presupuesto` — traduce las respuestas crudas del
 * backend Ant (`ModPresupuestoService`, puerto 6302) a los modelos tipados
 * que consumen las pantallas, y expone la jerarquía organizativa compartida
 * (`ModSysAdminService`, puerto 6301 — el mismo servicio que ya usa el menú
 * lateral) para el selector de jerarquía de cada pantalla.
 *
 * Migrado de `ModBudgetService` (legado STG,
 * `docs/07-modulos/presupuesto/compartido/servicios/mod-budget.service.ts`).
 *
 * No necesita registrar nada en el sidebar ni en el breadcrumb "a mano": a
 * diferencia de Kaypacha (que carga sus categorías desde una ruta propia),
 * la navegación de Presupuesto (Líneas/Gestión) sale íntegra de `list_sec` —
 * el mismo árbol genérico que ya arma `MenuStgService` para cualquier
 * sistema de STG — así que el panel de Col 2 y el ítem de Col 1 los resuelve
 * el mecanismo genérico existente (`SidebarComponent.getPanelStg`), siempre
 * que las rutas Angular calcen con el `act_sec` real del backend.
 */
@Injectable({ providedIn: 'root' })
export class PresupuestoService {
  private readonly ant = inject(ModPresupuestoService);
  private readonly antAdmin = inject(ModSysAdminService);
  private readonly shell = inject(ShellStateService);

  // ─── Contexto del usuario activo ────────────────────────────────────────────

  private get email(): string {
    return this.shell.usuarioActivo()?.email ?? '';
  }

  private get codBt(): string | undefined {
    return this.shell.usuarioActivo()?.codBt;
  }

  /**
   * Habilita edición: responsable vigente del nodo (`bp.act_res`, ver cada
   * pantalla) O administrador. El legado usa `profile.tip_use === 0`; este
   * Host no tiene ese campo — se usa `esAdmin` (admin-sistema/admin-general)
   * como equivalente más cercano. Pendiente de confirmar con negocio/backend
   * si son realmente el mismo nivel de acceso.
   */
  esAdmin(): boolean {
    return this.shell.esAdmin();
  }

  /**
   * Fecha de corte de negocio usada por `baseInit` en el legado
   * (`profile.curr_fec`, vía `UserService`) — este Host todavía no expone ese
   * campo en `UsuarioActivo`, así que se usa la fecha real como aproximación
   * hasta confirmar el campo real con el backend.
   */
  fechaCorte(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // ─── Jerarquía organizativa (selector de jerarquía, compartido por pantalla) ─

  obtenerJerarquiaBase(codHierarchy: number): Observable<HierarquiaNodo[]> {
    return this.antAdmin.getBaseHierarchy(this.email, codHierarchy).pipe(
      map((response) => (response.body as JerarquiaResponseBody | null)?.base_hierarchy ?? [])
    );
  }

  obtenerJerarquiaNivel(
    codHier: number,
    lvlHier: number,
    tipCod: number,
    codRels: string[],
    params?: Record<string, unknown>
  ): Observable<HierarquiaNodo[]> {
    return this.antAdmin.getLevelHierarchy(codHier, lvlHier, tipCod, codRels, params).pipe(
      map((response) => (response.body as JerarquiaResponseBody | null)?.level_hierarchy ?? [])
    );
  }

  // ─── Responsables ──────────────────────────────────────────────────────────

  obtenerResponsables(tipCod: number): Observable<ResponsableFila[]> {
    return this.ant.getRegResultados(tipCod).pipe(map((r) => this.parseLista<ResponsableFila>(r.body)));
  }

  guardarResponsables(filas: ResponsableFila[]): Observable<unknown> {
    return this.ant.postRegResultados(this.codBt, filas);
  }

  // ─── Tablero de verificación ────────────────────────────────────────────────

  obtenerLogVerificaciones(tipCod: number, codSec: string): Observable<LogVerificacionFila[]> {
    return this.ant
      .getLogVerificaciones(tipCod, codSec)
      .pipe(map((r) => this.parseLista<LogVerificacionFila>(r.body)));
  }

  verificar(tipCod: number, codRel: string, codSec: string): Observable<unknown> {
    return this.ant.postLogVerificaciones(this.codBt, tipCod, codRel, codSec);
  }

  // ─── Cartera de créditos ─────────────────────────────────────────────────────

  obtenerResumenCarteraCreditos(tipCod: number, codRel: string): Observable<ResumenCarteraCreditos> {
    return this.ant
      .getResCarCreditos(this.email, tipCod, codRel)
      .pipe(map((r) => this.parseResumen<ResumenCarteraCreditos>(r.body)));
  }

  guardarResumenCarteraCreditos(
    tipCod: number,
    codRel: string,
    filas: FilaCarteraCreditosVariables[]
  ): Observable<unknown> {
    return this.ant.postResCarCreditos(this.codBt, tipCod, codRel, filas);
  }

  // ─── Depósitos / Seguros ("línea simple") ────────────────────────────────────

  obtenerResumenDepBP(tipCod: number, codRel: string): Observable<ResumenLineaSimple<FilaDeposito>> {
    return this.ant.getResDepBP(this.email, tipCod, codRel).pipe(map((r) => this.parseResumen(r.body)));
  }

  guardarResumenDepBP(tipCod: number, codRel: string, filas: FilaDeposito[]): Observable<unknown> {
    return this.ant.postResDepBP(this.codBt, tipCod, codRel, filas);
  }

  obtenerResumenDepRed(tipCod: number, codRel: string): Observable<ResumenLineaSimple<FilaDeposito>> {
    return this.ant.getResDepRed(this.email, tipCod, codRel).pipe(map((r) => this.parseResumen(r.body)));
  }

  guardarResumenDepRed(tipCod: number, codRel: string, filas: FilaDeposito[]): Observable<unknown> {
    return this.ant.postResDepRed(this.codBt, tipCod, codRel, filas);
  }

  obtenerResumenSegComercial(tipCod: number, codRel: string): Observable<ResumenLineaSimple<FilaSegurosComercial>> {
    return this.ant.getResSegComercial(this.email, tipCod, codRel).pipe(map((r) => this.parseResumen(r.body)));
  }

  guardarResumenSegComercial(tipCod: number, codRel: string, filas: FilaSegurosComercial[]): Observable<unknown> {
    return this.ant.postResSegComercial(this.codBt, tipCod, codRel, filas);
  }

  obtenerResumenSegOperaciones(
    tipCod: number,
    codRel: string
  ): Observable<ResumenLineaSimple<FilaSegurosOperaciones>> {
    return this.ant.getResSegOperaciones(this.email, tipCod, codRel).pipe(map((r) => this.parseResumen(r.body)));
  }

  guardarResumenSegOperaciones(tipCod: number, codRel: string, filas: FilaSegurosOperaciones[]): Observable<unknown> {
    return this.ant.postResSegOperaciones(this.codBt, tipCod, codRel, filas);
  }

  // ─── Privados ────────────────────────────────────────────────────────────

  private parseLista<T>(body: unknown): T[] {
    const json = (body as ListaResponseBody | null)?.resultado?.list?.[0]?.JSONLIST;
    return json ? (JSON.parse(json) as T[]) : [];
  }

  private parseResumen<T extends ResumenLineaSimple>(body: unknown): T {
    const resumen = (body as ResumenResponseBody | null)?.resumen;
    return (resumen ?? { ws: [], bp: { tip_cod_edi: 0, ord_ini_edi: 0, act_res: false, cod_sec: '' } }) as T;
  }
}
