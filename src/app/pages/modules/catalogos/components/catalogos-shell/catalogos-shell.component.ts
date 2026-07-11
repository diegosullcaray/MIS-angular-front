import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogosService } from '../../services/catalogos.service';
import { ShellStateService } from '../../../../../core/services/shell-state.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideBookOpen, lucideLayers, lucideArrowRight, lucideClock, lucideSearch } from '@ng-icons/lucide';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';
import { InputTextModule } from 'primeng/inputtext';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-catalogos-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    CardModule,
    ButtonModule,
    NgIconComponent,
    ListSkeletonComponent,
    InlineErrorComponent,
    InputTextModule
  ],
  viewProviders: [provideIcons({
    lucideBookOpen, lucideLayers, lucideArrowRight, lucideClock, lucideSearch
  })],
  template: `
    <div class="catalogos-shell">
      <!-- Header -->
      <header class="page-header">
        <div>
          <h1 class="page-title">Catálogos del Host</h1>
          <p class="page-subtitle">Gestiona las listas de parámetros globales de la organización.</p>
        </div>
      </header>

      <!-- Error State -->
      @if (service.tieneError()) {
        <app-inline-error
          titulo="Error al cargar los catálogos"
          [detalle]="service.error()?.message"
          (reintentar)="service.cargarCatalogos()"
          class="mb-4"
        />
      }

      <!-- Loading / List Grid -->
      @if (service.isLoading()) {
        <div class="grid-loading">
          <app-list-skeleton [rows]="[1,2,3]" [cols]="[1,2,3,4]" />
        </div>
      } @else {
        <div class="catalogos-grid">
          @for (cat of service.catalogosMeta(); track cat.id) {
            <p-card class="catalogo-card" [class.catalogo-card--inactive]="!cat.activo">

              <div class="card-body">
                <div class="card-top">
                  <div class="card-icon" [class.card-icon--inactive]="!cat.activo">
                    <ng-icon name="lucideBookOpen" size="18" />
                  </div>
                  @if (!cat.activo) {
                    <span class="status-badge status-badge--inactive">Inactivo</span>
                  } @else {
                    <span class="status-badge status-badge--active">Activo</span>
                  }
                </div>

                <h3 class="card-title">{{ cat.nombre }}</h3>
                <p class="card-meta">
                  <span>Slug: <code>{{ cat.tipo }}</code></span>
                </p>

                <div class="card-stats">
                  <div class="stat-item">
                    <span class="stat-value">{{ cat.totalRegistros }}</span>
                    <span class="stat-label">Registros</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-value">
                      <ng-icon name="lucideClock" size="12" class="mr-1" />
                      {{ formatFecha(cat.ultimaActualizacion) }}
                    </span>
                    <span class="stat-label">Última mod.</span>
                  </div>
                </div>

                <div class="card-actions">
                  <p-button
                    [label]="shell.esAdmin() ? 'Gestionar' : 'Ver detalle'"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    [routerLink]="['/admin/catalogos', cat.tipo]"
                    [text]="true"
                    [disabled]="!cat.activo && !shell.esAdmin()"
                    (click)="seleccionarCatalogo(cat.tipo)"
                  />
                </div>
              </div>
            </p-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .catalogos-shell {
      display: flex;
      flex-direction: column;
      gap: var(--mis-space-6);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--mis-space-2);
    }

    .page-title {
      font-size: var(--mis-text-2xl);
      font-weight: var(--mis-font-bold);
      color: var(--mis-primary);
      margin: 0 0 var(--mis-space-1);
    }

    .page-subtitle {
      font-size: var(--mis-text-base);
      color: var(--mis-text-secondary);
      margin: 0;
    }

    /* Grid layout */
    .catalogos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--mis-space-5);
    }

    .catalogo-card {
      display: block;
      border: 1px solid var(--mis-border);
      border-radius: var(--mis-radius-md);
      box-shadow: var(--mis-shadow-sm);
      overflow: hidden;
      transition: all var(--mis-transition-base);

      &:hover {
        transform: translateY(-2px);
        box-shadow: var(--mis-shadow-md);
        border-color: var(--mis-border-strong);
      }
    }

    ::ng-deep .catalogo-card--inactive {
      opacity: 0.75;
      background: var(--mis-panel-bg);
    }

    .card-body {
      display: flex;
      flex-direction: column;
      gap: var(--mis-space-4);
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .card-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--mis-radius-sm);
      background: var(--mis-primary-light);
      color: var(--mis-primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-icon--inactive {
      background: var(--mis-border);
      color: var(--mis-text-tertiary);
    }

    .status-badge {
      font-size: 10px;
      font-weight: var(--mis-font-semibold);
      padding: 2px var(--mis-space-2);
      border-radius: var(--mis-radius-full);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-badge--active {
      background: var(--mis-success-light);
      color: var(--mis-success);
    }

    .status-badge--inactive {
      background: var(--mis-danger-light);
      color: var(--mis-danger);
    }


    .card-title {
      font-size: var(--mis-text-base);
      font-weight: var(--mis-font-bold);
      color: var(--mis-text-primary);
      margin: 0;
    }

    .card-meta {
      font-size: var(--mis-text-xs);
      color: var(--mis-text-secondary);
      margin: 0;

      code {
        background: var(--mis-primary-light);
        padding: 2px 4px;
        border-radius: var(--mis-radius-xs);
        font-family: monospace;
      }
    }

    .card-stats {
      display: flex;
      border-top: 1px solid var(--mis-border);
      border-bottom: 1px solid var(--mis-border);
      padding: var(--mis-space-3) 0;
      gap: var(--mis-space-6);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-value {
      font-size: var(--mis-text-sm);
      font-weight: var(--mis-font-semibold);
      color: var(--mis-text-primary);
      display: flex;
      align-items: center;
    }

    .stat-label {
      font-size: 10px;
      color: var(--mis-text-tertiary);
      text-transform: uppercase;
    }

    .card-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: -var(--mis-space-2);
    }
  `],
})
export class CatalogosShellComponent implements OnInit {
  protected readonly service = inject(CatalogosService);
  protected readonly shell = inject(ShellStateService);

  ngOnInit(): void {
    this.service.cargarCatalogos();
  }

  protected seleccionarCatalogo(tipo: string): void {
    this.shell.setCatalogoActivo(tipo);
  }

  protected formatFecha(fechaIso: string): string {
    const d = new Date(fechaIso);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
  }
}
