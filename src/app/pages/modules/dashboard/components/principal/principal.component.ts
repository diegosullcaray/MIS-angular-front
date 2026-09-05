import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { DashboardService } from '../../services/dashboard.service';
import { UsuariosReporteDialogComponent } from '../../ui/usuarios-reporte-dialog/usuarios-reporte-dialog.component';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import type { ReporteDashboard } from '../../models/reporte.model';

/** Dashboards Integrados (`/app/dashboards`) — migrado de `PrincipalComponent` (legado STG, `pages/modules/reportes-e/principal`). */
@Component({
  selector: 'app-dashboard-principal',
  standalone: true,
  imports: [TableModule, SkeletonModule, TooltipModule, UsuariosReporteDialogComponent, WindowPanelComponent],
  templateUrl: './principal.component.html',
})
export class PrincipalComponent {
  protected readonly dashboard = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly mostrarUsuarios = signal(false);

  constructor() {
    this.dashboard.cargarReportes();
  }

  protected actualizar(): void {
    this.dashboard.recargarReportes();
  }

  protected abrirReporte(reporte: ReporteDashboard): void {
    if (reporte.reportType !== 'PowerBIReport') return;
    this.dashboard.seleccionarReporte(reporte);
    this.router.navigate(['power-bi'], { relativeTo: this.activatedRoute });
  }

  protected mostrarDialogoUsuarios(): void {
    this.mostrarUsuarios.set(true);
  }

  protected iconoTipo(reportType: string): string {
    return reportType === 'PowerBIReport' ? 'pi pi-chart-line' : 'pi pi-database';
  }
}
