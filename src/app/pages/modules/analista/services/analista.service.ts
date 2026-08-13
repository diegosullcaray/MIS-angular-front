import { Injectable, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModSeccionesService } from '../../../../core/winder/instances/mod-secciones.service';
import { ModSysAdminService } from '../../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { FilaLabelValor } from '../models/comun.model';
import type { ColaboradorActivo, ColaboradorItem, NodoJerarquiaAncla } from '../models/colaborador.model';
import type { HistoricoVariable, ResumenDashboard } from '../models/dashboard.model';
import type { FilaBeca, FilaLead } from '../models/listas.model';
import type {
  BaseHierResponseBody,
  ClienteResponseBody,
  DashboardResponseBody,
  HistoricoResponseBody,
  ListaResponseBody,
  ListPickResponseBody,
  PostBecaResponseBody,
} from '../models/analista-api.model';

/**
 * `cod_jer` de la jerarquía usada para ubicar el nodo ancla del admin — mismo
 * código (9, "Admin. Comercial") que Categorización y que Cartera
 * Créditos/Seguros Comercial en Presupuesto.
 */
const COD_JERARQUIA_ANCLA = 9;

/**
 * Fachada del módulo `analista` — migrado de `AnalistaService` + `ModSecService`
 * (legado STG, `docs/07-modulos/analista`). Cubre Principal (dashboard) y
 * Listas (Becas/Priorización de Leads); "Detalle" reutiliza
 * `obtenerDetalleCliente`. La sección "Prospecto" del legado (CRUD de
 * "Prospecto Corresponsal") queda fuera — se asume cubierta por
 * `pages/modules/actividades/components/prospectos-corresponsal`.
 *
 * El legado guardaba el colaborador activo como propiedades mutables sueltas
 * (`cod_bt`/`nom_sec`) y avisaba los cambios con un `Subject` (`selectedSec$`)
 * al que cada pantalla se suscribía. Acá es un solo signal (`colaboradorActivo`)
 * — cada componente reacciona con un `effect()` en vez de una subscripción RxJS.
 */
@Injectable({ providedIn: 'root' })
export class AnalistaService {
  private readonly ant = inject(ModSeccionesService);
  private readonly antAdmin = inject(ModSysAdminService);
  private readonly shell = inject(ShellStateService);

  readonly colaboradorActivo = signal<ColaboradorActivo | null>(null);

  private get email(): string {
    return this.shell.usuarioActivo()?.email ?? '';
  }

  esAdmin(): boolean {
    return this.shell.esAdmin();
  }

  /** Fija al usuario activo como colaborador — pantallas para quien NO es admin. */
  usarColaboradorPropio(): void {
    const usuario = this.shell.usuarioActivo();
    if (!usuario?.codBt) return;
    this.colaboradorActivo.set({ codBt: usuario.codBt, nombre: usuario.nombre });
  }

  establecerColaborador(item: ColaboradorItem): void {
    this.colaboradorActivo.set({ codBt: item.cod_sec, nombre: item.des_sec });
  }

  // ─── Principal (dashboard) ──────────────────────────────────────────────

  obtenerDashboard(codBt: string): Observable<ResumenDashboard | null> {
    return this.ant
      .getResumenDashboard(codBt)
      .pipe(map((response) => (response.body as DashboardResponseBody | null)?.resultado ?? null));
  }

  obtenerHistoricoVariable(codBt: string, codVar: string): Observable<HistoricoVariable | null> {
    return this.ant
      .getHistoricoVariable(codBt, codVar)
      .pipe(map((response) => (response.body as HistoricoResponseBody | null)?.resultado ?? null));
  }

  obtenerDetalleCliente(codBt: string, numDoc: string, tipDoc: number, pais: number): Observable<FilaLabelValor[]> {
    return this.ant
      .getDetalleCliente(codBt, numDoc, tipDoc, pais)
      .pipe(map((response) => (response.body as ClienteResponseBody | null)?.resultado?.prof ?? []));
  }

  // ─── Listas ──────────────────────────────────────────────────────────────

  obtenerListaPrioLeads(codBt: string): Observable<FilaLead[]> {
    return this.ant
      .getListaPrioLeads(codBt)
      .pipe(map((response) => ((response.body as ListaResponseBody | null)?.resultado as FilaLead[]) ?? []));
  }

  obtenerListaBecas(codBt: string): Observable<FilaBeca[]> {
    return this.ant
      .getListaBecas(codBt)
      .pipe(map((response) => ((response.body as ListaResponseBody | null)?.resultado as FilaBeca[]) ?? []));
  }

  prospectarBeca(codBt: string, numDoc: string, comentario: string): Observable<{ exito: boolean; fecPro?: string }> {
    return this.ant.postProsBecas(codBt, numDoc, comentario).pipe(
      map((response) => {
        const result = (response as { body?: PostBecaResponseBody } | null)?.body?.result;
        return { exito: result?.code === 200, fecPro: result?.fec_pro };
      })
    );
  }

  // ─── Selector de colaborador (admin) ────────────────────────────────────

  /**
   * Nodo ancla del admin en la jerarquía (`base_hier`, `cod_jer=9`) — primer
   * nodo con `flag_1` en `{0,1}`, tal cual el filtro del legado
   * (`PrincipalComponent.ngOnInit`) — un valor posible menos que el de
   * Categorización (`{0,1,2}`), se preserva la diferencia tal cual está en
   * cada pantalla del legado.
   */
  obtenerAnclaAdmin(): Observable<NodoJerarquiaAncla | null> {
    return this.antAdmin.getBaseHierarchy(this.email, COD_JERARQUIA_ANCLA).pipe(
      map((response) => {
        const nodos = (response.body as BaseHierResponseBody | null)?.base_hierarchy ?? [];
        return nodos.find((n) => n.flag_1 === 0 || n.flag_1 === 1) ?? null;
      })
    );
  }

  obtenerColaboradores(tipCod: number, codRel: string): Observable<ColaboradorItem[]> {
    return this.antAdmin
      .getListPick01(tipCod, codRel)
      .pipe(map((response) => (response.body as ListPickResponseBody | null)?.list_res ?? []));
  }
}
