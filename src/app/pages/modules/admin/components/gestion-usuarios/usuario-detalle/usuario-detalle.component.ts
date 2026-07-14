import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CardModule } from 'primeng/card';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideInfo, lucideShield, lucideBoxes, lucideChevronRight
} from '@ng-icons/lucide';
import { AccesosService } from '../../../services/accesos.service';
import { SistemasService } from '../../../services/sistemas.service';
import { ROL_LABELS, type RolSlug, type Usuario } from '../../../models/acceso.model';
import { ListSkeletonComponent } from '../../../../../../shared/ui/list-skeleton/list-skeleton.component';

type Tab = 'info' | 'roles';

/**
 * Detalle de Usuario (Gestión de Usuarios).
 * Pestañas: Información General | Roles.
 */
@Component({
  selector: 'app-usuario-detalle',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ButtonModule,
    SelectButtonModule,
    CardModule,
    NgIconComponent,
    ListSkeletonComponent
  ],
  viewProviders: [provideIcons({
    lucideInfo, lucideShield, lucideBoxes, lucideChevronRight
  })],
  templateUrl: './usuario-detalle.component.html',
  styleUrl: './usuario-detalle.component.css',
})
export class UsuarioDetalleComponent {
  protected readonly accesos = inject(AccesosService);
  protected readonly sistemasService = inject(SistemasService);

  // Input bound from route parameter :id
  readonly id = input.required<string>();

  protected readonly rolLabels = ROL_LABELS;

  // ─── Estado ──────────────────────────────────────────────────────────────

  protected readonly usuario = signal<Usuario | null>(null);
  protected readonly cargando = signal(true);
  protected readonly tab = signal<Tab>('info');

  protected readonly tabOptions = [
    { label: 'Información General', value: 'info' },
    { label: 'Roles', value: 'roles' }
  ];

  // ─── Computed ────────────────────────────────────────────────────────────

  /** Rol (entidad) asignado al usuario, resuelto por slug. */
  protected readonly rolAsignado = computed(() => {
    const slug = this.usuario()?.rol;
    return slug ? this.accesos.roles().find(r => r.slug === slug) ?? null : null;
  });

  /** Sistemas registrados habilitados para este usuario. */
  protected readonly sistemasHabilitados = computed(() => {
    const subs = this.usuario()?.subsistemas ?? [];
    return this.sistemasService.sistemas().filter(s => subs.includes(s.slug));
  });

  constructor() {
    this.accesos.cargarRoles();
    this.sistemasService.cargarSistemas();

    effect(() => {
      const id = this.id();
      if (id) this.cargar(id);
    });
  }

  private async cargar(id: string): Promise<void> {
    this.cargando.set(true);
    try {
      this.usuario.set(await this.accesos.obtenerUsuario(id));
    } catch {
      this.usuario.set(null);
    } finally {
      this.cargando.set(false);
    }
  }

  protected rolLabel(slug: RolSlug): string {
    return ROL_LABELS[slug] ?? slug;
  }

  protected formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
