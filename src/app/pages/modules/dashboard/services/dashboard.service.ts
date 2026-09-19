import { DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { Observable, Subscription, map } from 'rxjs';
import { identidadConsulta } from '../../../../shared/utils/identidad-consulta.util';
import { ModDashboardService } from '../../../../core/winder/instances/mod-dashboard.service';
import { ShellStateService } from '../../../../core/services/shell-state.service';
import type { ReporteDashboard, UsuariosPorReporte } from '../models/reporte.model';
import type { ListaReportesBody, TokenReporteBody, UsuariosReporteBody } from '../models/dashboard-api.model';

/** Estado compartido entre el listado y la ruta Power BI; se invalida por identidad. */
@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly ant = inject(ModDashboardService);
  private readonly shell = inject(ShellStateService);

  private readonly reportesState = signal<ReporteDashboard[]>([]);
  readonly reportes = this.reportesState.asReadonly();
  /** `mod_admin` del backend — controla el botón "Usuarios" (no se combina con el rol del Host, igual que el legado). */
  private readonly moduloAdminState = signal(false);
  readonly moduloAdmin = this.moduloAdminState.asReadonly();
  private readonly cargandoState = signal(false);
  readonly cargando = this.cargandoState.asReadonly();
  private readonly errorState = signal<string | null>(null);
  readonly error = this.errorState.asReadonly();
  private readonly reporteSeleccionadoState = signal<ReporteDashboard | null>(null);
  readonly reporteSeleccionado = this.reporteSeleccionadoState.asReadonly();

  private cargado = false;
  private consulta?: Subscription;
  private identidad = '';

  constructor() {
    effect(() => {
      const clave = identidadConsulta(this.shell.usuarioActivo());
      untracked(() => this.sincronizarIdentidad(clave));
    });
    inject(DestroyRef).onDestroy(() => this.consulta?.unsubscribe());
  }

  private sincronizarIdentidad(clave = identidadConsulta(this.shell.usuarioActivo())): void {
    if (clave === this.identidad) return;
    this.consulta?.unsubscribe();
    this.identidad = clave;
    this.cargado = false;
    this.reportesState.set([]);
    this.reporteSeleccionadoState.set(null);
    this.moduloAdminState.set(false);
    this.cargandoState.set(false);
    this.errorState.set(null);
  }

  private get codBt(): string | undefined {
    return this.shell.usuarioActivo()?.codBt;
  }

  /** Carga la lista de reportes una sola vez por sesión; llamadas repetidas no vuelven a pedirla (usar `recargarReportes()` para forzar). */
  cargarReportes(): void {
    this.sincronizarIdentidad();
    if (this.cargado) return;
    const identidad = this.identidad;
    this.consulta?.unsubscribe();
    this.cargado = true;
    this.cargandoState.set(true);
    this.errorState.set(null);

    this.consulta = this.ant.getObjectList(this.codBt, this.shell.esAdmin() ? 1 : 0).subscribe({
      next: (respuesta) => {
        if (identidad !== identidadConsulta(this.shell.usuarioActivo())) return;
        const resultado = (respuesta.body as ListaReportesBody | null)?.resultado;
        this.reportesState.set(resultado?.list ?? []);
        this.moduloAdminState.set(resultado?.mod_admin === 1);
        this.cargandoState.set(false);
      },
      error: () => {
        if (identidad !== identidadConsulta(this.shell.usuarioActivo())) return;
        this.errorState.set('No se pudo cargar la lista de reportes.');
        this.cargandoState.set(false);
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
    this.sincronizarIdentidad();
    this.reporteSeleccionadoState.set(reporte);
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
