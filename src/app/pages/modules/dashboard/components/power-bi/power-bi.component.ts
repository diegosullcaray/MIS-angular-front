import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { PowerBIEmbedModule } from 'powerbi-client-angular';
import { models, type IReportEmbedConfiguration } from 'powerbi-client';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../../../../shared/services/toast.service';

/**
 * Visor de un reporte Power BI embebido (`/app/dashboards/power-bi`) —
 * migrado de `PowerbiComponent` (legado STG, `pages/modules/reportes-e/powerbi`).
 *
 * Lee el reporte activo de `DashboardService.reporteSeleccionado` (fijado
 * por `PrincipalComponent.abrirReporte()` antes de navegar acá) en vez del
 * `ReplaySubject` del legado (`ReportesEService.selectedReportObs$`). Si se
 * entra a esta ruta sin haber seleccionado un reporte antes (ej. refresh de
 * página), vuelve directo a la lista — no hay nada que embeber sin el `id`.
 *
 * `PowerBIEmbedModule` es un `NgModule` de terceros, pero no requiere
 * `forRoot()` — permitido por el TRD (§2.3) para componentes standalone.
 */
@Component({
  selector: 'app-dashboard-power-bi',
  standalone: true,
  imports: [ButtonModule, SkeletonModule, PowerBIEmbedModule],
  templateUrl: './power-bi.component.html',
  styleUrl: './power-bi.component.css',
})
export class PowerBiComponent {
  private readonly dashboard = inject(DashboardService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  protected readonly reporte = this.dashboard.reporteSeleccionado;
  protected readonly cargando = signal(true);
  protected readonly embedConfig = signal<IReportEmbedConfiguration | null>(null);
  protected readonly reportClass = 'w-full h-full';

  constructor() {
    const reporte = this.reporte();
    if (!reporte) {
      this.volver();
      return;
    }

    this.dashboard.obtenerTokenReporte(reporte.id, reporte.datasetId ?? '').subscribe({
      next: (token) => {
        this.embedConfig.set({
          type: 'report',
          id: reporte.id,
          embedUrl: 'https://app.powerbi.com/reportEmbed',
          accessToken: token,
          tokenType: models.TokenType.Embed,
          settings: {
            localeSettings: { language: 'es' },
            panes: { filters: { expanded: false, visible: false } },
            bars: { statusBar: { visible: true } },
            layoutType: models.LayoutType.Custom,
            customLayout: { displayOption: models.DisplayOption.FitToPage },
            background: models.BackgroundType.Transparent,
          },
        });
        this.cargando.set(false);
      },
      error: () => {
        this.toast.error('No se pudo cargar el reporte', 'Inténtalo de nuevo en unos segundos.');
        this.cargando.set(false);
      },
    });
  }

  protected volver(): void {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
