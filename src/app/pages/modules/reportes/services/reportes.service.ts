import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { ModSysAdminService } from '../../../../core/winder/instances/mod-sys-admin.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { FilaEncabezadoReporte, FilaReporte, HierarquiaNodo, TablaReporteResultado } from '../models';

/** `cod_jer` de la jerarquía organizativa (`UNI_1` del legado) — mismo código que usan Presupuesto/Kaypacha/Incentivos para `base_hier`. */
export const COD_JERARQUIA_ORGANIZATIVA = 9;
/** Profundidad máxima de niveles de `UNI_1` — `getHierarchyConfig('UNI_1')` del legado. */
export const NIVEL_MAXIMO_JERARQUIA = 6;

interface JerarquiaResponseBody {
  base_hierarchy?: HierarquiaNodo[];
  level_hierarchy?: HierarquiaNodo[];
}

interface ReporteResponseBody {
  result?: { headers?: FilaEncabezadoReporte[]; body?: FilaReporte[]; additional?: Record<string, unknown> };
}

/**
 * Fachada del módulo `reportes`: jerarquía organizativa + datos de cada bloque.
 *
 * Sin estado compartido entre pantallas — cada reporte tiene su propio nivel de
 * jerarquía seleccionado, a diferencia de Incentivos/ESG.
 */
@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly ant = inject(ModReportesService);
  private readonly antAdmin = inject(ModSysAdminService);
  private readonly shell = inject(ShellStateService);

  private get email(): string {
    return this.shell.usuarioActivo()?.email ?? '';
  }

  /** Fecha del último día completado (`YYYYMMDD`) — `fec_day_ult` del legado (`Moments().add(-1,'days')`), usada por los parámetros propios de cada reporte (ej. `RS_MON_REP`). */
  fechaUltimoDia(): string {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    return ayer.toISOString().slice(0, 10).replace(/-/g, '');
  }

  /**
   * Fecha de corte (`YYYY-MM-DD`) con la que se pide cada nivel de la jerarquía.
   * Distinta de `fechaUltimoDia()` (`YYYYMMDD`, un día antes).
   *
   * El fallback a la fecha real puede pedir un día que el backend no cerró todavía
   * y devolver la jerarquía vacía; solo aplica si el Host aún no expuso `fechaCorte`.
   */
  fechaCorte(): string {
    const currFec = this.shell.usuarioActivo()?.fechaCorte;
    if (currFec && /^\d{8}$/.test(currFec)) {
      return `${currFec.slice(0, 4)}-${currFec.slice(4, 6)}-${currFec.slice(6, 8)}`;
    }
    return new Date().toISOString().slice(0, 10);
  }

  obtenerJerarquiaBase(codHierarchy: number): Observable<HierarquiaNodo[]> {
    return this.antAdmin
      .getBaseHierarchy(this.email, codHierarchy)
      .pipe(map((r) => (r.body as JerarquiaResponseBody | null)?.base_hierarchy ?? []));
  }

  obtenerJerarquiaNivel(
    codHier: number,
    lvlHier: number,
    tipCod: number,
    codRels: string[],
    params?: Record<string, unknown>
  ): Observable<HierarquiaNodo[]> {
    return this.antAdmin
      .getLevelHierarchy(codHier, lvlHier, tipCod, codRels, params)
      .pipe(map((r) => (r.body as JerarquiaResponseBody | null)?.level_hierarchy ?? []));
  }

  /** Un bloque del motor de reportes "mixtos" (tabla multi-encabezado o tarjeta KPI, según `codRep`). */
  obtenerBloqueReporte(codRep: string, params: Record<string, unknown>): Observable<TablaReporteResultado> {
    return this.ant.getRegularData(codRep, params).pipe(
      map((r) => {
        const result = (r.body as ReporteResponseBody | null)?.result;
        return { headers: result?.headers ?? [], body: result?.body ?? [], additional: result?.additional ?? {} };
      })
    );
  }
}
