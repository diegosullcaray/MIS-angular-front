import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { CardModule } from 'primeng/card';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideBoxes, lucideEye, lucideEdit2, lucideTrash2, lucideAlertTriangle, lucideLayers
} from '@ng-icons/lucide';
import { SistemasService } from '../../services/sistemas.service';
import { SISTEMA_ESTADO_LABELS, type SistemaEstado, type SistemaResumen } from '../../models/sistema.model';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { InlineErrorComponent } from '../../../../../shared/ui/inline-error/inline-error.component';

@Component({
  selector: 'app-sistemas-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TableModule,
    ButtonModule,
    DialogModule,
    CardModule,
    NgIconComponent,
    ListSkeletonComponent,
    EmptyStateComponent,
    InlineErrorComponent
  ],
  viewProviders: [provideIcons({
    lucideBoxes, lucideEye, lucideEdit2, lucideTrash2, lucideAlertTriangle, lucideLayers
  })],
  templateUrl: './sistemas-list.component.html',
  styleUrl: './sistemas-list.component.css',
})
export class SistemasListComponent implements OnInit {
  protected readonly service = inject(SistemasService);

  protected readonly estadoLabels = SISTEMA_ESTADO_LABELS;

  protected readonly confirmDeleteOpen = signal(false);
  protected readonly sistemaAEliminar = signal<SistemaResumen | null>(null);
  protected readonly errorEliminar = signal<string | null>(null);

  ngOnInit(): void {
    this.service.cargarSistemas();
  }

  protected estadoLabel(estado: SistemaEstado): string {
    return SISTEMA_ESTADO_LABELS[estado];
  }

  protected estadoClase(estado: SistemaEstado): string {
    return {
      activo:        'badge--success',
      mantenimiento: 'badge--warn',
      inactivo:      'badge--danger',
    }[estado];
  }

  protected formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  protected confirmarEliminar(sistema: SistemaResumen): void {
    this.sistemaAEliminar.set(sistema);
    this.errorEliminar.set(null);
    this.confirmDeleteOpen.set(true);
  }

  protected async eliminar(): Promise<void> {
    const sistema = this.sistemaAEliminar();
    if (!sistema) return;

    try {
      await this.service.eliminarSistema(sistema.id);
      this.confirmDeleteOpen.set(false);
      this.sistemaAEliminar.set(null);
    } catch (err: any) {
      // 409: el sistema está asignado a roles
      this.errorEliminar.set(
        err?.error?.message ?? 'No se pudo eliminar el sistema. Inténtalo de nuevo.'
      );
    }
  }
}
