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
    this.confirmDeleteOpen.set(true);
  }

  protected async eliminar(): Promise<void> {
    const rol = this.rolAEliminar();
    if (rol) {
      await this.service.eliminarRol(rol.id);
      this.confirmDeleteOpen.set(false);
      this.rolAEliminar.set(null);
    }
  }
}
