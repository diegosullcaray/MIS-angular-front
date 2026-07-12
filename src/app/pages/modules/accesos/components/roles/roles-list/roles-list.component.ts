import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccesosService } from '../../../services/accesos.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucidePlus, lucideEdit2, lucideTrash2, lucideAlertTriangle } from '@ng-icons/lucide';
import { ListSkeletonComponent } from '../../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { EmptyStateComponent } from '../../../../../../shared/ui/empty-state/empty-state.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TableModule,
    ButtonModule,
    DialogModule,
    NgIconComponent,
    ListSkeletonComponent,
    EmptyStateComponent
  ],
  viewProviders: [provideIcons({
    lucideArrowLeft, lucidePlus, lucideEdit2, lucideTrash2, lucideAlertTriangle
  })],
  templateUrl: './roles-list.component.html',
  styleUrl: './roles-list.component.css',
})
export class RolesListComponent implements OnInit {
  protected readonly service = inject(AccesosService);

  protected readonly confirmDeleteOpen = signal(false);
  protected readonly rolAEliminar = signal<any | null>(null);
  protected readonly errorEliminar = signal<string | null>(null);

  ngOnInit(): void {
    this.service.cargarRoles();
  }

  protected formatRemoteLabel(slug: string): string {
    const labels: Record<string, string> = {
      'subsistema-contabilidad': 'Contabilidad',
      'subsistema-rrhh':         'RRHH',
      'subsistema-ventas':       'Ventas',
      'subsistema-logistica':    'Logística',
    };
    return labels[slug] ?? slug.replace('subsistema-', '');
  }

  protected confirmarEliminar(rol: any): void {
    this.rolAEliminar.set(rol);
    this.errorEliminar.set(null);
    this.confirmDeleteOpen.set(true);
  }

  protected async eliminar(): Promise<void> {
    const rol = this.rolAEliminar();
    if (!rol) return;

    try {
      await this.service.eliminarRol(rol.id);
      this.confirmDeleteOpen.set(false);
      this.rolAEliminar.set(null);
    } catch (err: any) {
      // 409: el rol tiene usuarios asignados (regla del Backend Schema §3.7)
      this.errorEliminar.set(
        err?.error?.message ?? 'No se pudo eliminar el rol. Inténtalo de nuevo.'
      );
    }
  }
}
