import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideEye, lucidePencil, lucideTrash2, lucideAlertTriangle } from '@ng-icons/lucide';
import { MIS_ICON_PROVIDERS, MIS_ICON_FALLBACK } from '../../../../../../shared/constants/mis-icons.constants';
import { SistemasService } from '../../services/sistemas.service';
import { SISTEMA_ESTADO_LABELS, type SistemaEstado, type SistemaResumen } from '../../models/sistema.model';
import { ListSkeletonComponent } from '../../../../../../shared/ui/list-skeleton/list-skeleton.component';
import { EmptyStateComponent } from '../../../../../../shared/ui/empty-state/empty-state.component';
import { InlineErrorComponent } from '../../../../../../shared/ui/inline-error/inline-error.component';

@Component({
  selector: 'app-sistemas-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NgIconComponent,
    ListSkeletonComponent,
    EmptyStateComponent,
    InlineErrorComponent
  ],
  viewProviders: [provideIcons({
    ...MIS_ICON_PROVIDERS, lucideEye, lucidePencil, lucideTrash2, lucideAlertTriangle
  })],
  templateUrl: './sistemas-list.component.html',
  styleUrl: './sistemas-list.component.css',
})
export class SistemasListComponent implements OnInit {
  protected readonly service = inject(SistemasService);

  protected readonly estadoLabels = SISTEMA_ESTADO_LABELS;
  protected readonly iconFallback = MIS_ICON_FALLBACK;

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
