import { Component, inject, signal } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { SkeletonModule } from 'primeng/skeleton';
import { TooltipModule } from 'primeng/tooltip';
import { PowerBIEmbedModule } from 'powerbi-client-angular';
import { models, type IReportEmbedConfiguration } from 'powerbi-client';
import { DashboardService } from '../../services/dashboard.service';
import { ToastService } from '../../../../../shared/services/toast.service';
import { WindowPanelComponent } from '../../../../../shared/ui/window-panel/window-panel.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';

/** Visor de un reporte Power BI embebido (`/app/dashboards/power-bi`) — migrado de `PowerbiComponent` (legado STG, `pages/modules/reportes-e/powerbi`). */
@Component({
  selector: 'app-dashboard-power-bi',
  standalone: true,
  imports: [SkeletonModule, TooltipModule, PowerBIEmbedModule, WindowPanelComponent, InlineErrorComponent],
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
  protected readonly error = signal(false);
  protected readonly embedConfig = signal<IReportEmbedConfiguration | null>(null);
  protected readonly reportClass = 'w-full h-full';

  constructor() {
    if (!this.reporte()) {
      this.volver();
      return;
    }
    this.cargar();
  }

  protected cargar(): void {
    const reporte = this.reporte();
    if (!reporte) return;
    this.cargando.set(true);
    this.error.set(false);
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
        this.error.set(true);
        this.cargando.set(false);
      },
    });
  }

  protected volver(): void {
    this.router.navigate(['../'], { relativeTo: this.activatedRoute });
  }
}
