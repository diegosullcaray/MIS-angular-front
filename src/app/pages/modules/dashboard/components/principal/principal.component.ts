import { Component, computed, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../services/dashboard.service';
import { UsuariosReporteDialogComponent } from '../../ui/usuarios-reporte-dialog/usuarios-reporte-dialog.component';
import { TIPO_REPORTE_ORACLE_AC, TIPO_REPORTE_POWER_BI } from '../../models';
import type { ReporteDashboard, TipoReporte } from '../../models';

/**
 * Dashboards Integrados (`/app/dashboards`) — migrado de `PrincipalComponent`
 * (legado STG, `pages/modules/reportes-e/principal`). Reemplaza `stg-table2`
 * (tabla custom) por `p-table` (PrimeNG) + Tailwind, y los
 * `mat-button-toggle` de filtro por `p-togglebutton`.
 *
 * Solo los reportes `reportType==='PowerBIReport'` son embebibles hoy —
 * clic en el nombre de cualquier otro tipo no hace nada, igual que
 * `actionLink()` del legado (que solo reaccionaba a ese tipo).
 */
@Component({
  selector: 'app-dashboard-principal',
  standalone: true,
  imports: [ButtonModule, ToggleButtonModule, InputTextModule, TableModule, SkeletonModule, FormsModule, UsuariosReporteDialogComponent],
  templateUrl: './principal.component.html',
  styleUrl: './principal.component.css',
})
export class PrincipalComponent {
  protected readonly dashboard = inject(DashboardService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly filtroTexto = signal('');
  protected readonly filtroPowerBI = signal(false);
  protected readonly filtroOracle = signal(false);
  protected readonly mostrarUsuarios = signal(false);

  protected readonly reportesFiltrados = computed(() => {
    const termino = this.filtroTexto().trim().toLowerCase();
    const pbi = this.filtroPowerBI();
    const oracle = this.filtroOracle();
    // Ningún filtro de tipo activo, o ambos a la vez, muestra todo — igual que `btn1===btn2` del legado.
    const tipos: TipoReporte[] =
      pbi === oracle ? [TIPO_REPORTE_POWER_BI, TIPO_REPORTE_ORACLE_AC] : [...(pbi ? [TIPO_REPORTE_POWER_BI] : []), ...(oracle ? [TIPO_REPORTE_ORACLE_AC] : [])];

    return this.dashboard
      .reportes()
      .filter((r) => r.name.toLowerCase().includes(termino) && tipos.includes(r.typ_rep));
  });

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
