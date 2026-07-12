import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CardModule } from 'primeng/card';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import {
  lucideInfo, lucideNetwork, lucideShieldCheck,
  lucidePlus, lucideTrash2, lucideChevronRight, lucideCheck, lucideLayers
} from '@ng-icons/lucide';
import { SistemasService } from '../../services/sistemas.service';
import { AccesosService } from '../../../accesos/services/accesos.service';
import {
  SISTEMA_ESTADO_LABELS,
  type Seccion,
  type Sistema,
  type SistemaEstado,
} from '../../models/sistema.model';
import type { Rol } from '../../../accesos/models/acceso.model';
import { FormsModule } from '@angular/forms';
import { ListSkeletonComponent } from '../../../../../shared/ui/list-skeleton/list-skeleton.component';

type Tab = 'info' | 'estructura' | 'permisos';

@Component({
  selector: 'app-sistema-detalle',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ButtonModule, SelectButtonModule, CardModule, NgIconComponent, ListSkeletonComponent],
  viewProviders: [provideIcons({
    lucideInfo, lucideNetwork, lucideShieldCheck,
    lucidePlus, lucideTrash2, lucideChevronRight, lucideCheck, lucideLayers
  })],
  templateUrl: './sistema-detalle.component.html',
  styleUrl: './sistema-detalle.component.css',
})
export class SistemaDetalleComponent {
  protected readonly service = inject(SistemasService);
  protected readonly accesos = inject(AccesosService);

  // Input bound from route parameter :id
  readonly id = input.required<string>();

  protected readonly estadoLabels = SISTEMA_ESTADO_LABELS;

  // ─── Estado general ──────────────────────────────────────────────────────

  protected readonly sistema = signal<Sistema | null>(null);
  protected readonly cargando = signal(true);
  protected readonly tab = signal<Tab>('info');

  protected readonly tabOptions = [
    { label: 'Información', value: 'info' },
    { label: 'Estructura', value: 'estructura' },
    { label: 'Permisos', value: 'permisos' }
  ];

  // ─── Editor de estructura (borrador local) ───────────────────────────────

  protected readonly estructura = signal<Seccion[]>([]);
  protected readonly estructuraDirty = signal(false);
  protected readonly guardandoEstructura = signal(false);
  protected readonly msgEstructura = signal<string | null>(null);

  // ─── Permisos por rol ────────────────────────────────────────────────────

  protected readonly rolSeleccionado = signal<Rol | null>(null);
  protected readonly modulosPermitidos = signal<Set<string>>(new Set());
  protected readonly permisosDirty = signal(false);
  protected readonly guardandoPermisos = signal(false);
  protected readonly msgPermisos = signal<string | null>(null);

  // ─── Computed ────────────────────────────────────────────────────────────

  protected readonly totalSubsecciones = computed(() =>
    this.sistema()?.secciones.reduce((a, s) => a + s.subsecciones.length, 0) ?? 0
  );

  protected readonly totalModulos = computed(() =>
    this.sistema()?.secciones.reduce(
      (a, s) => a + s.subsecciones.reduce((b, sub) => b + sub.modulos.length, 0), 0
    ) ?? 0
  );

  /** Roles que tienen asignado este sistema (por slug). */
  protected readonly rolesConSistema = computed(() => {
    const slug = this.sistema()?.slug;
    return slug ? this.accesos.roles().filter(r => r.subsistemas.includes(slug)) : [];
  });

  constructor() {
    this.accesos.cargarRoles();

    effect(() => {
      const id = this.id();
      if (id) this.cargarSistema(id);
    });
  }

  private async cargarSistema(id: string): Promise<void> {
    this.cargando.set(true);
    try {
      const s = await this.service.obtenerSistema(id);
      this.sistema.set(s);
      this.estructura.set(structuredClone(s.secciones));
      this.estructuraDirty.set(false);
    } catch {
      this.sistema.set(null);
    } finally {
      this.cargando.set(false);
    }
  }

  protected estadoClase(estado: SistemaEstado): string {
    return {
      activo:        'badge--success',
      mantenimiento: 'badge--warn',
      inactivo:      'badge--danger',
    }[estado];
  }

  protected formatFecha(iso: string): string {
    return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  // ─── Editor de estructura ────────────────────────────────────────────────

  private nuevoId(prefijo: string): string {
    return `${prefijo}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private slugDe(nombre: string): string {
    return nombre.toLowerCase().trim()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }

  protected agregarSeccion(input: HTMLInputElement): void {
    const nombre = input.value.trim();
    if (!nombre) return;

    this.estructura.update(list => [
      ...list,
      { id: this.nuevoId('sec'), nombre, slug: this.slugDe(nombre), subsecciones: [] },
    ]);
    this.marcarDirty();
    input.value = '';
  }

  protected agregarSubseccion(seccionId: string, input: HTMLInputElement): void {
    const nombre = input.value.trim();
    if (!nombre) return;

    this.estructura.update(list =>
      list.map(sec => sec.id !== seccionId ? sec : {
        ...sec,
        subsecciones: [
          ...sec.subsecciones,
          { id: this.nuevoId('sub'), nombre, slug: this.slugDe(nombre), modulos: [] },
        ],
      })
    );
    this.marcarDirty();
    input.value = '';
  }

  protected agregarModulo(subseccionId: string, input: HTMLInputElement): void {
    const nombre = input.value.trim();
    if (!nombre) return;

    this.estructura.update(list =>
      list.map(sec => ({
        ...sec,
        subsecciones: sec.subsecciones.map(sub => sub.id !== subseccionId ? sub : {
          ...sub,
          modulos: [
            ...sub.modulos,
            { id: this.nuevoId('mod'), nombre, slug: this.slugDe(nombre), activo: true },
          ],
        }),
      }))
    );
    this.marcarDirty();
    input.value = '';
  }

  protected eliminarSeccion(seccionId: string): void {
    this.estructura.update(list => list.filter(s => s.id !== seccionId));
    this.marcarDirty();
  }

  protected eliminarSubseccion(seccionId: string, subseccionId: string): void {
    this.estructura.update(list =>
      list.map(sec => sec.id !== seccionId ? sec : {
        ...sec,
        subsecciones: sec.subsecciones.filter(sub => sub.id !== subseccionId),
      })
    );
    this.marcarDirty();
  }

  protected eliminarModulo(subseccionId: string, moduloId: string): void {
    this.estructura.update(list =>
      list.map(sec => ({
        ...sec,
        subsecciones: sec.subsecciones.map(sub => sub.id !== subseccionId ? sub : {
          ...sub,
          modulos: sub.modulos.filter(m => m.id !== moduloId),
        }),
      }))
    );
    this.marcarDirty();
  }

  protected renombrarSeccion(seccionId: string, event: Event): void {
    const nombre = (event.target as HTMLInputElement).value.trim();
    if (!nombre) return;
    this.estructura.update(list =>
      list.map(sec => sec.id !== seccionId ? sec : { ...sec, nombre })
    );
    this.marcarDirty();
  }

  private marcarDirty(): void {
    this.estructuraDirty.set(true);
    this.msgEstructura.set(null);
  }

  protected descartarEstructura(): void {
    const s = this.sistema();
    if (s) {
      this.estructura.set(structuredClone(s.secciones));
      this.estructuraDirty.set(false);
      this.msgEstructura.set(null);
    }
  }

  protected async guardarEstructura(): Promise<void> {
    const s = this.sistema();
    if (!s) return;

    this.guardandoEstructura.set(true);
    this.msgEstructura.set(null);
    try {
      const actualizado = await this.service.guardarEstructura(s.id, this.estructura());
      this.sistema.set(actualizado);
      this.estructura.set(structuredClone(actualizado.secciones));
      this.estructuraDirty.set(false);
      this.msgEstructura.set('Estructura guardada correctamente.');
      // Si el rol seleccionado en Permisos tenía módulos eliminados, recargar
      const rol = this.rolSeleccionado();
      if (rol) this.seleccionarRol(rol);
    } catch (err: any) {
      this.msgEstructura.set(err?.error?.message ?? 'No se pudo guardar la estructura.');
    } finally {
      this.guardandoEstructura.set(false);
    }
  }

  // ─── Permisos ────────────────────────────────────────────────────────────

  protected async seleccionarRol(rol: Rol): Promise<void> {
    const s = this.sistema();
    if (!s) return;

    this.rolSeleccionado.set(rol);
    this.permisosDirty.set(false);
    this.msgPermisos.set(null);

    try {
      const permisos = await this.service.obtenerPermisos(s.id);
      const delRol = permisos.find(p => p.rolId === rol.id);
      this.modulosPermitidos.set(new Set(delRol?.modulos ?? []));
    } catch {
      this.modulosPermitidos.set(new Set());
    }
  }

  protected moduloPermitido(moduloId: string): boolean {
    return this.modulosPermitidos().has(moduloId);
  }

  protected toggleModulo(moduloId: string): void {
    this.modulosPermitidos.update(set => {
      const nuevo = new Set(set);
      nuevo.has(moduloId) ? nuevo.delete(moduloId) : nuevo.add(moduloId);
      return nuevo;
    });
    this.permisosDirty.set(true);
    this.msgPermisos.set(null);
  }

  /** Marca/desmarca todos los módulos de una subsección. */
  protected toggleSubseccion(seccionId: string, subseccionId: string): void {
    const sub = this.sistema()?.secciones
      .find(s => s.id === seccionId)?.subsecciones
      .find(s => s.id === subseccionId);
    if (!sub) return;

    const ids = sub.modulos.map(m => m.id);
    const todosMarcados = ids.every(id => this.modulosPermitidos().has(id));

    this.modulosPermitidos.update(set => {
      const nuevo = new Set(set);
      for (const id of ids) todosMarcados ? nuevo.delete(id) : nuevo.add(id);
      return nuevo;
    });
    this.permisosDirty.set(true);
    this.msgPermisos.set(null);
  }

  protected subseccionCompleta(seccionId: string, subseccionId: string): boolean {
    const sub = this.sistema()?.secciones
      .find(s => s.id === seccionId)?.subsecciones
      .find(s => s.id === subseccionId);
    if (!sub || sub.modulos.length === 0) return false;
    return sub.modulos.every(m => this.modulosPermitidos().has(m.id));
  }

  protected modulosMarcadosEnSeccion(seccion: Seccion): number {
    return seccion.subsecciones.reduce(
      (a, sub) => a + sub.modulos.filter(m => this.modulosPermitidos().has(m.id)).length, 0
    );
  }

  protected modulosTotalesEnSeccion(seccion: Seccion): number {
    return seccion.subsecciones.reduce((a, sub) => a + sub.modulos.length, 0);
  }

  protected async guardarPermisos(): Promise<void> {
    const s = this.sistema();
    const rol = this.rolSeleccionado();
    if (!s || !rol) return;

    this.guardandoPermisos.set(true);
    this.msgPermisos.set(null);
    try {
      await this.service.guardarPermisosRol(s.id, rol.id, [...this.modulosPermitidos()]);
      this.permisosDirty.set(false);
      this.msgPermisos.set(`Permisos de "${rol.nombre}" guardados correctamente.`);
    } catch (err: any) {
      this.msgPermisos.set(err?.error?.message ?? 'No se pudieron guardar los permisos.');
    } finally {
      this.guardandoPermisos.set(false);
    }
  }
}
