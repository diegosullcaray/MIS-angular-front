import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft, lucideInfo, lucideBoxes, lucideUsers, lucideChevronRight
} from '@ng-icons/lucide';
import { AccesosService } from '../../../services/accesos.service';
import { SistemasService } from '../../../../sistemas/services/sistemas.service';
import { ROL_LABELS, type Rol, type Usuario } from '../../../models/acceso.model';
import type { PermisoRolSistema } from '../../../../sistemas/models/sistema.model';
import { ListSkeletonComponent } from '../../../../../../shared/ui/list-skeleton/list-skeleton.component';

type Tab = 'detalle' | 'sistemas' | 'usuarios';

@Component({
  selector: 'app-rol-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule, TableModule, NgIconComponent, ListSkeletonComponent],
  viewProviders: [provideIcons({
    lucideArrowLeft, lucideInfo, lucideBoxes, lucideUsers, lucideChevronRight
  })],
  templateUrl: './rol-detalle.component.html',
  styleUrl: './rol-detalle.component.css',
})
export class RolDetalleComponent {
  protected readonly accesos = inject(AccesosService);
  protected readonly sistemasService = inject(SistemasService);

  // Input bound from route parameter :id
  readonly id = input.required<string>();

  protected readonly rolLabels = ROL_LABELS;

  // ─── Estado ──────────────────────────────────────────────────────────────

  protected readonly rol = signal<Rol | null>(null);
  protected readonly usuarios = signal<Usuario[]>([]);
  protected readonly permisos = signal<PermisoRolSistema[]>([]);
  protected readonly cargando = signal(true);
  protected readonly tab = signal<Tab>('detalle');

  protected readonly tabs: { id: Tab; etiqueta: string; icono: string }[] = [
    { id: 'detalle',  etiqueta: 'Detalle',  icono: 'lucideInfo' },
    { id: 'sistemas', etiqueta: 'Sistemas', icono: 'lucideBoxes' },
    { id: 'usuarios', etiqueta: 'Usuarios', icono: 'lucideUsers' },
  ];

  // ─── Computed ────────────────────────────────────────────────────────────

  /** Sistemas registrados que este rol tiene asignados. */
  protected readonly sistemasAsignados = computed(() => {
    const rol = this.rol();
    if (!rol) return [];
    return this.sistemasService.sistemas().filter(s => rol.subsistemas.includes(s.slug));
  });

  protected readonly usuariosActivos = computed(
    () => this.usuarios().filter(u => u.activo).length
  );

  constructor() {
    this.sistemasService.cargarSistemas();

    effect(() => {
      const id = this.id();
      if (id) this.cargar(id);
    });
  }

  private async cargar(id: string): Promise<void> {
    this.cargando.set(true);
    try {
      const [rol, usuarios, permisos] = await Promise.all([
        this.accesos.obtenerRol(id),
        this.accesos.obtenerUsuariosDeRol(id),
        this.sistemasService.obtenerPermisosDeRol(id),
      ]);
      this.rol.set(rol);
      this.usuarios.set(usuarios);
      this.permisos.set(permisos);
    } catch {
      this.rol.set(null);
    } finally {
      this.cargando.set(false);
    }
  }

  /** Módulos permitidos de este rol en un sistema dado. */
  protected modulosPermitidosEn(sistemaId: string): number {
    return this.permisos().find(p => p.sistemaId === sistemaId)?.modulos.length ?? 0;
  }

  protected formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
