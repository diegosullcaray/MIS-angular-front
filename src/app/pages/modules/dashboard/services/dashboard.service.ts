import { Injectable, inject, signal } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ModDashboardService } from '../../../../core/winder/instances/mod-dashboard.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { ReporteDashboard, UsuariosPorReporte } from '../models/reporte.model';
import type { ListaReportesBody, TokenReporteBody, UsuariosReporteBody } from '../models/dashboard-api.model';

/**
 * Fachada del módulo `dashboard` (Dashboards Integrados, `/app/dashboards`)
 * — traduce las respuestas crudas del backend Ant (`ModDashboardService`,
 * puerto 6302) a los modelos tipados que consumen las pantallas, y mantiene
 * la lista de reportes como estado compartido (`reportes`/`reporteSeleccionado`)
 * para que `PowerBiComponent` (ruta separada, `/app/dashboards/power-bi`)
 * sepa qué reporte embeber sin depender de un `@Input()` — igual patrón que
 * `KaypachaService.categorias`, reemplazando el `ReplaySubject` del legado
 * (`ReportesEService.selectedReportObs$`).
 *
 * Migrado de `ReportesEService`/`ModReportesEService` (legado STG,
 * `pages/modules/reportes-e/compartido/servicios`).
 */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly ant = inject(ModDashboardService);
  private readonly shell = inject(ShellStateService);

  readonly reportes = signal<ReporteDashboard[]>([]);
  /** `mod_admin` del backend — controla el botón "Usuarios" (no se combina con el rol del Host, igual que el legado). */
  readonly moduloAdmin = signal(false);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly reporteSeleccionado = signal<ReporteDashboard | null>(null);

  private cargado = false;

  private get codBt(): string | undefined {
    return this.shell.usuarioActivo()?.codBt;
  }

  /** Carga la lista de reportes una sola vez por sesión; llamadas repetidas no vuelven a pedirla (usar `recargarReportes()` para forzar). */
  cargarReportes(): void {
    if (this.cargado) return;
    this.cargado = true;
    this.cargando.set(true);
    this.error.set(null);

    this.ant.getObjectList(this.codBt, this.shell.esAdmin() ? 1 : 0).subscribe({
      next: (respuesta) => {
        const resultado = (respuesta.body as ListaReportesBody | null)?.resultado;
        this.reportes.set(resultado?.list ?? []);
        this.moduloAdmin.set(resultado?.mod_admin === 1);
        this.cargando.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar la lista de reportes.');
        this.cargando.set(false);
        this.cargado = false;
      },
    });
  }

  /** Recarga forzada (botón "Actualizar"). */
  recargarReportes(): void {
    this.cargado = false;
    this.cargarReportes();
  }

  seleccionarReporte(reporte: ReporteDashboard): void {
    this.reporteSeleccionado.set(reporte);
  }

  obtenerTokenReporte(reportId: string, datasetId: string): Observable<string> {
    return this.ant
      .getPowerBIReportToken(reportId, datasetId)
      .pipe(map((r) => (r.body as TokenReporteBody | null)?.resultado?.token ?? ''));
  }

  obtenerUsuariosReporte(reportId: string): Observable<string[]> {
    return this.ant.getObjectUsers(reportId).pipe(
      map((r) => {
        const resultado = (r.body as UsuariosReporteBody | null)?.resultado;
        const lista = resultado?.code !== 'void' ? resultado?.row?.use_lis : undefined;
        return lista ? lista.split(',') : [];
      })
    );
  }

  guardarUsuariosPorReporte(cambios: UsuariosPorReporte[]): Observable<unknown> {
    return this.ant.postObjectUsers(cambios);
  }
}
