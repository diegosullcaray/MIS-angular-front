import { Component, inject, computed } from '@angular/core';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideGrid, lucideUsers, lucideActivity, lucideServer
} from '@ng-icons/lucide';
import { ShellStateService } from '../../../core/services/shell-state.service';
import { AccesosService } from '../accesos/services/accesos.service';
import { SistemasService } from '../sistemas/services/sistemas.service';
import { CardModule } from 'primeng/card';
import { ListSkeletonComponent } from '../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../shared/ui/inline-error/inline-error.component';

/**
 * Mi espacio — Dashboard del Host (Figma: dashboard_interaccion.html, Frame 1).
 * KPIs de la plataforma + tabla de estado de los microfrontends remotos.
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgIconComponent, CardModule, ListSkeletonComponent, InlineErrorComponent],
  viewProviders: [provideIcons({
    lucideGrid, lucideUsers, lucideActivity, lucideServer
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

      <!-- KPI Row (Figma: kpi-row) -->
      <section class="kpi-grid">
        <p-card class="kpi-card">
          <div class="kpi-content">
            <div class="kpi-details">
              <span class="kpi-label">Sistemas</span>
              <span class="kpi-value">{{ sistemasService.totalActivos() }} Activos</span>
            </div>
            <div class="kpi-icon kpi-icon--sky">
              <ng-icon name="lucideGrid" size="18" />
            </div>
          </div>
        </p-card>

        @if (shell.esAdminSistema()) {
          <p-card class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-details">
                <span class="kpi-label">Usuarios</span>
                <span class="kpi-value">{{ accesosService.totalUsuariosActivos() }}</span>
              </div>
              <div class="kpi-icon kpi-icon--navy">
                <ng-icon name="lucideUsers" size="18" />
              </div>
            </div>
          </p-card>

          <p-card class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-details">
                <span class="kpi-label">Roles</span>
                <span class="kpi-value">{{ accesosService.totalRoles() }}</span>
              </div>
              <div class="kpi-icon kpi-icon--amber">
                <ng-icon name="lucideActivity" size="18" />
              </div>
            </div>
          </p-card>
        }

        <p-card class="kpi-card">
          <div class="kpi-content">
            <div class="kpi-details">
              <span class="kpi-label">Servidores</span>
              <span class="kpi-value">Dokploy</span>
            </div>
            <div class="kpi-icon kpi-icon--green">
              <ng-icon name="lucideServer" size="18" />
            </div>
          </div>
        </p-card>
      </section>

      <!-- Estado de Microfrontends Remotos (Figma: table-card) -->
      <section class="table-card">
        <div class="table-header-box">Estado de Microfrontends Remotos</div>

        @if (sistemasService.isLoading()) {
          <div class="table-padding">
            <app-list-skeleton [rows]="[1, 2, 3]" />
          </div>
        } @else if (sistemasService.error()) {
          <div class="table-padding">
            <app-inline-error
              titulo="No se pudo cargar el estado de los sistemas"
              [detalle]="sistemasService.error()!"
              (reintentar)="sistemasService.cargarSistemas()"
            />
          </div>
        } @else {
          <table class="grid-table">
            <thead>
              <tr>
                <th>Slug</th>
                <th>Módulo / Remote</th>
                <th>Versión</th>
                <th>Módulos</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              @for (sistema of sistemasService.sistemas(); track sistema.id) {
                <tr>
                  <td>{{ sistema.slug.replace('subsistema-', '') }}</td>
                  <td>{{ sistema.nombre }}</td>
                  <td><code>v{{ sistema.version }}</code></td>
                  <td>{{ sistema.totalModulos }}</td>
                  <td>
                    <span class="status-badge" [class]="'status-badge--' + sistema.estado">
                      {{ etiquetaEstado(sistema.estado) }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="empty-row">No hay sistemas registrados.</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </section>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: var(--mis-space-6);
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

    /* KPI Row */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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
      justify-content: space-between;
      gap: var(--mis-space-4);
    }

    .kpi-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--mis-radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .kpi-icon--navy  { background: var(--mis-primary-light);   color: var(--mis-primary); }
    .kpi-icon--sky   { background: var(--mis-secondary-light); color: var(--mis-secondary); }
    .kpi-icon--green { background: var(--mis-success-light);   color: var(--mis-success); }
    .kpi-icon--amber { background: var(--mis-warning-light);   color: var(--mis-warning); }

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
      font-size: 20px;
      font-weight: var(--mis-font-bold);
      color: var(--mis-text-primary);
      line-height: 1.2;
    }

    /* Tabla de estado de MFEs */
    .table-card {
      background: var(--mis-surface);
      border: 1px solid var(--mis-border);
      border-radius: var(--mis-radius-md);
      overflow: hidden;
      box-shadow: var(--mis-shadow-sm);
    }

    .table-header-box {
      padding: var(--mis-space-3) var(--mis-space-4);
      border-bottom: 1px solid var(--mis-border);
      font-weight: var(--mis-font-semibold);
      font-size: var(--mis-text-sm);
      color: var(--mis-text-primary);
    }

    .table-padding {
      padding: var(--mis-space-4);
    }

    .grid-table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--mis-text-sm);
    }

    .grid-table th {
      background: var(--mis-panel-bg);
      padding: var(--mis-space-2) var(--mis-space-4);
      text-align: left;
      font-size: 10px;
      font-weight: var(--mis-font-bold);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--mis-text-tertiary);
      border-bottom: 1px solid var(--mis-border);
    }

    .grid-table td {
      padding: var(--mis-space-3) var(--mis-space-4);
      border-bottom: 1px solid rgba(29, 57, 110, 0.04);
      color: var(--mis-text-primary);
    }

    .grid-table tr:last-child td {
      border-bottom: none;
    }

    .grid-table code {
      font-size: 12px;
      background: var(--mis-primary-light);
      color: var(--mis-primary);
      padding: 1px 5px;
      border-radius: 4px;
    }

    .empty-row {
      text-align: center;
      color: var(--mis-text-tertiary);
    }

    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: var(--mis-radius-full);
      font-size: 10px;
      font-weight: var(--mis-font-bold);
      letter-spacing: 0.5px;
    }

    .status-badge--activo        { background: var(--mis-success-light); color: var(--mis-success); }
    .status-badge--mantenimiento { background: var(--mis-warning-light); color: var(--mis-warning); }
    .status-badge--inactivo      { background: var(--mis-danger-light);  color: var(--mis-danger); }
  `],
})
export class DashboardComponent {
  protected readonly shell = inject(ShellStateService);
  protected readonly sistemasService = inject(SistemasService);
  protected readonly accesosService = inject(AccesosService);

  constructor() {
    this.sistemasService.cargarSistemas();
    if (this.shell.esAdminSistema()) {
      this.accesosService.cargarUsuarios();
      this.accesosService.cargarRoles();
    }
  }

  protected readonly primerNombre = computed(() => {
    const nombre = this.shell.usuarioActivo()?.nombre ?? '';
    return nombre.split(' ')[0];
  });

  protected etiquetaEstado(estado: string): string {
    switch (estado) {
      case 'activo':        return 'ONLINE';
      case 'mantenimiento': return 'MANTENIMIENTO';
      default:              return 'OFFLINE';
    }
  }
}
