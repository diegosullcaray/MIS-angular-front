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
 * Fachada del módulo `reportes` — reemplaza a `ModRepService`
 * (`reportes/compartido/servicios/mod-rep.service.ts`, jerarquía) +
 * `ComercialService`/`ant-mod-rep.service.ts` (`getMixData`/`ReportType.REGULAR`,
 * datos de cada bloque) del legado. Cada pantalla de reporte (ej.
 * `MonitorMetasDesembolsoComponent`) inyecta este servicio directamente en
 * vez de compartir estado — a diferencia de Incentivos/ESG, los reportes de
 * este módulo no comparten ningún nivel de jerarquía seleccionado entre sí,
 * igual que en el legado (cada ruta `mon-desem`/`mon-rep` era una pantalla
 * independiente con su propio `hier-rem-selector`).
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

  /** Fecha de corte (`YYYY-MM-DD`) — `getHierarchyConfig('UNI_1').params` del legado, usada al pedir cada nivel de la jerarquía (distinta de `fechaUltimoDia()`, que es `YYYYMMDD` y un día antes). El Host no expone `profile.curr_fec` todavía, se usa la fecha real. */
  fechaCorte(): string {
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
