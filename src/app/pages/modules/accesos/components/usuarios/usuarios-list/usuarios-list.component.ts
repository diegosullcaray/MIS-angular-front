import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AccesosService } from '../../../services/accesos.service';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucidePlus, lucideEdit2, lucideTrash2, lucideSearch, lucideCheck, lucideX } from '@ng-icons/lucide';
import { ListSkeletonComponent } from '../../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { EmptyStateComponent } from '../../../../../../shared/ui/empty-state/empty-state.component';
import { CommonModule } from '@angular/common';
import { ROL_LABELS, type RolSlug } from '../../../models/acceso.model';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TableModule,
    ButtonModule,
    InputTextModule,
    NgIconComponent,
    ListSkeletonComponent,
    EmptyStateComponent
  ],
  viewProviders: [provideIcons({
    lucideArrowLeft, lucidePlus, lucideEdit2, lucideTrash2, lucideSearch, lucideCheck, lucideX
  })],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.css',
})
export class UsuariosListComponent implements OnInit {
  protected readonly service = inject(AccesosService);

  ngOnInit(): void {
    this.service.cargarUsuarios();
  }

  protected onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.service.cargarUsuarios(value);
  }

  protected getRolLabel(rol: string): string {
    return ROL_LABELS[rol as RolSlug] ?? rol;
  }

  protected getRolClass(rol: string): string {
    const classes: Record<string, string> = {
      'admin-sistema':   'bg-[var(--mis-danger-light)] text-[var(--mis-danger)]',
      'admin-general':   'bg-[var(--mis-warning-light)] text-[var(--mis-warning)]',
      'supervisor-area': 'bg-[var(--mis-info-light)] text-[var(--mis-info)]',
    };
    return classes[rol] ?? '';
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

  protected async toggleStatus(user: any): Promise<void> {
    await this.service.cambiarEstadoUsuario(user.id, !user.activo);
  }
}
