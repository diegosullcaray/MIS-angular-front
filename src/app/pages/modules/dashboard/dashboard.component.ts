import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideGrid, lucideUsers, lucideActivity,
  lucideCheckCircle2, lucideLayers, lucideArrowRight
} from '@ng-icons/lucide';
import { ShellStateService } from '../../../core/services/shell-state.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, NgIconComponent, CardModule, ButtonModule],
  viewProviders: [provideIcons({
    lucideGrid, lucideUsers, lucideActivity,
    lucideCheckCircle2, lucideLayers, lucideArrowRight
  })],
  template: `
    <div class="dashboard-container">
      <!-- Welcome Header -->
      <header class="dashboard-header">
        <h1 class="welcome-title">¡Hola, {{ primerNombre() }}!</h1>
        <p class="welcome-subtitle">
          Bienvenido al centro de control del Sistema de Información Gerencial (MIS).
        </p>
      </header>

      <!-- KPI Grid -->
      <section class="kpi-grid">
        <p-card class="kpi-card">
          <div class="kpi-content">
            <div class="kpi-icon kpi-icon--navy">
              <ng-icon name="lucideLayers" size="20" />
            </div>
            <div class="kpi-details">
              <span class="kpi-label">Sistemas Disponibles</span>
              <span class="kpi-value">{{ totalSistemas() }}</span>
            </div>
          </div>
        </p-card>

        @if (shell.esAdminSistema()) {
          <p-card class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-icon kpi-icon--sky">
                <ng-icon name="lucideUsers" size="20" />
              </div>
              <div class="kpi-details">
                <span class="kpi-label">Usuarios Activos</span>
                <span class="kpi-value">3</span>
              </div>
            </div>
          </p-card>
        }

        <p-card class="kpi-card">
          <div class="kpi-content">
            <div class="kpi-icon kpi-icon--green">
              <ng-icon name="lucideCheckCircle2" size="20" />
            </div>
            <div class="kpi-details">
              <span class="kpi-label">Estado de la Shell</span>
              <span class="kpi-value text-success">Activo</span>
            </div>
          </div>
        </p-card>
      </section>

      <!-- Access Area -->
      <section class="access-section">
        <h2 class="section-title">Sistemas Autorizados</h2>
        <div class="systems-grid">
          <!-- Main Host Features -->
          @if (shell.esAdmin()) {
            <div class="system-box">
              <div class="system-box-header">
                <div class="system-icon system-icon--navy">
                  <ng-icon name="lucideGrid" size="24" />
                </div>
                <div>
                  <h3 class="system-title">Catálogos del Host</h3>
                  <p class="system-desc">Gestión central de bancos, monedas y entidades.</p>
                </div>
              </div>
              <div class="system-box-footer">
                <a routerLink="/admin/catalogos" class="system-link">
                  Administrar
                  <ng-icon name="lucideArrowRight" size="14" />
                </a>
              </div>
            </div>
          }

          @if (shell.esAdminSistema()) {
            <div class="system-box">
              <div class="system-box-header">
                <div class="system-icon system-icon--sky">
                  <ng-icon name="lucideUsers" size="24" />
                </div>
                <div>
                  <h3 class="system-title">Gestión de Accesos (IAM)</h3>
                  <p class="system-desc">Administración de usuarios, roles y permisos de remotos.</p>
                </div>
              </div>
              <div class="system-box-footer">
                <a routerLink="/admin/accesos" class="system-link">
                  Configurar
                  <ng-icon name="lucideArrowRight" size="14" />
                </a>
              </div>
            </div>
          }

          <!-- Dynamically Listed Remote Systems -->
          @for (sub of shell.subsistemas(); track sub) {
            <div class="system-box">
              <div class="system-box-header">
                <div class="system-icon system-icon--purple">
                  <ng-icon name="lucideActivity" size="24" />
                </div>
                <div>
                  <h3 class="system-title">{{ formatLabel(sub) }}</h3>
                  <p class="system-desc">Subsistema embebido cargado dinámicamente.</p>
                </div>
              </div>
              <div class="system-box-footer">
                <a [routerLink]="['/admin', sub]" class="system-link">
                  Acceder
                  <ng-icon name="lucideArrowRight" size="14" />
                </a>
              </div>
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: var(--mis-space-8);
    }

    .dashboard-header {
      margin-bottom: var(--mis-space-2);
    }

    .welcome-title {
      font-size: var(--mis-text-2xl);
      font-weight: var(--mis-font-bold);
      color: var(--mis-primary);
      margin: 0 0 var(--mis-space-1);
    }

    .welcome-subtitle {
      font-size: var(--mis-text-base);
      color: var(--mis-text-secondary);
      margin: 0;
    }

    /* KPI Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: var(--mis-space-4);
    }

    .kpi-card {
      display: block;
      border: 1px solid var(--mis-border);
      border-radius: var(--mis-radius-md);
      box-shadow: var(--mis-shadow-sm);
    }

    .kpi-content {
      display: flex;
      align-items: center;
      gap: var(--mis-space-4);
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: var(--mis-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-icon--navy {
      background: var(--mis-primary-light);
      color: var(--mis-primary);
    }

    .kpi-icon--sky {
      background: var(--mis-secondary-light);
      color: var(--mis-secondary);
    }

    .kpi-icon--green {
      background: var(--mis-success-light);
      color: var(--mis-success);
    }


    .kpi-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .kpi-label {
      font-size: var(--mis-text-xs);
      font-weight: var(--mis-font-semibold);
      color: var(--mis-text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .kpi-value {
      font-size: 24px;
      font-weight: var(--mis-font-bold);
      color: var(--mis-text-primary);
      line-height: 1;
    }

    /* Access Section */
    .access-section {
      display: flex;
      flex-direction: column;
      gap: var(--mis-space-4);
    }

    .section-title {
      font-size: var(--mis-text-lg);
      font-weight: var(--mis-font-semibold);
      color: var(--mis-text-primary);
      margin: 0;
    }

    .systems-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--mis-space-5);
    }

    .system-box {
      background: var(--mis-surface);
      border: 1px solid var(--mis-border);
      border-radius: var(--mis-radius-md);
      padding: var(--mis-space-5);
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: var(--mis-space-4);
      box-shadow: var(--mis-shadow-sm);
      transition: all var(--mis-transition-base);

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--mis-shadow-md);
        border-color: var(--mis-border-strong);
      }
    }

    .system-box-header {
      display: flex;
      align-items: flex-start;
      gap: var(--mis-space-4);
    }

    .system-icon {
      width: 44px;
      height: 44px;
      border-radius: var(--mis-radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .system-icon--navy {
      background: var(--mis-primary-light);
      color: var(--mis-primary);
    }

    .system-icon--sky {
      background: var(--mis-secondary-light);
      color: var(--mis-secondary);
    }

    .system-icon--purple {
      background: #F3E8FF;
      color: #7C3AED;
    }


    .system-title {
      font-size: var(--mis-text-base);
      font-weight: var(--mis-font-semibold);
      color: var(--mis-text-primary);
      margin: 0 0 2px;
    }

    .system-desc {
      font-size: var(--mis-text-sm);
      color: var(--mis-text-secondary);
      margin: 0;
      line-height: var(--mis-leading-normal);
    }

    .system-box-footer {
      border-top: 1px solid var(--mis-border);
      padding-top: var(--mis-space-3);
    }

    .system-link {
      display: inline-flex;
      align-items: center;
      gap: var(--mis-space-2);
      color: var(--mis-primary);
      text-decoration: none;
      font-size: var(--mis-text-sm);
      font-weight: var(--mis-font-semibold);
      transition: color var(--mis-transition-fast);

      &:hover {
        color: var(--mis-secondary-hover);
      }
    }
  `],
})
export class DashboardComponent {
  protected readonly shell = inject(ShellStateService);

  protected readonly primerNombre = computed(() => {
    const nombre = this.shell.usuarioActivo()?.nombre ?? '';
    return nombre.split(' ')[0];
  });

  protected readonly totalSistemas = computed(() => {
    let count = this.shell.subsistemas().length;
    if (this.shell.esAdmin()) count++; // Catálogos
    if (this.shell.esAdminSistema()) count++; // Accesos
    return count;
  });

  protected formatLabel(slug: string): string {
    const labels: Record<string, string> = {
      'subsistema-contabilidad': 'Contabilidad',
      'subsistema-rrhh': 'RRHH',
      'subsistema-ventas': 'Ventas',
      'subsistema-logistica': 'Logística',
    };
    return labels[slug] ?? slug.replace('subsistema-', '');
  }
}
