import { Injectable, signal, computed } from '@angular/core';
import type { RolSlug } from '../../pages/modules/accesos/models/acceso.model';

// ─── Tipos del estado global ──────────────────────────────────────────────────

export interface UsuarioActivo {
  id: string;
  nombre: string;
  email: string;
  rol: RolSlug;
  /** Slugs de Remotes habilitados para este usuario */
  subsistemas: string[];
  avatarUrl?: string;
}

export interface MenuItemActivo {
  ruta: string;
  etiqueta: string;
  /** Slug del subsistema activo (undefined = Host principal) */
  subsistema?: string;
}

// ─── ShellStateService ───────────────────────────────────────────────────────

/**
 * Singleton del Host que actúa como contrato de comunicación con los Remotes.
 *
 * - Signals privados: solo el Host puede mutar el estado.
 * - `asReadonly()`: los Remotes solo pueden leer.
 *
 * Regla RN-03: la comunicación Host ↔ Remote ocurre ÚNICAMENTE a través de
 * los signals expuestos vía `asReadonly()`.
 */
@Injectable({ providedIn: 'root' })
export class ShellStateService {

  // ─── Signals privados (escritura solo desde el Host) ────────────────────

  private readonly _usuarioActivo = signal<UsuarioActivo | null>(null);


  private readonly _menuItemActivo = signal<MenuItemActivo | null>(null);
  private readonly _catalogoActivo = signal<string | null>(null);
  private readonly _sidebarIconActivo = signal<string>('host-inicio');

  // ─── Signals de solo lectura (expuestos — Remotes solo leen) ────────────

  /** Usuario autenticado actualmente. */
  readonly usuarioActivo = this._usuarioActivo.asReadonly();

  /** Ítem del menú principal actualmente seleccionado. */
  readonly menuItemActivo = this._menuItemActivo.asReadonly();

  /** Slug del catálogo activo (seleccionado en el Host). */
  readonly catalogoActivo = this._catalogoActivo.asReadonly();

  /** ID del ícono activo en la Col 1 del sidebar. */
  readonly sidebarIconActivo = this._sidebarIconActivo.asReadonly();

  // ─── Computed ────────────────────────────────────────────────────────────

  /** True si el usuario puede gestionar IAM (usuarios, roles). */
  readonly esAdminSistema = computed(
    () => this._usuarioActivo()?.rol === 'admin-sistema'
  );

  /**
   * True si el usuario tiene acceso operativo completo
   * (admin-general o admin-sistema).
   */
  readonly esAdmin = computed(() =>
    ['admin-sistema', 'admin-general'].includes(
      this._usuarioActivo()?.rol ?? ''
    )
  );

  /** Subsistemas habilitados (controla visibilidad de íconos en Col 1). */
  readonly subsistemas = computed(
    () => this._usuarioActivo()?.subsistemas ?? []
  );

  /** Iniciales del usuario para el avatar. */
  readonly inicialesUsuario = computed(() => {
    const nombre = this._usuarioActivo()?.nombre ?? '';
    return nombre
      .split(' ')
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase() ?? '')
      .join('');
  });

  // ─── Métodos de mutación (solo el Host invoca estos) ─────────────────────

  setUsuarioActivo(usuario: UsuarioActivo): void {
    this._usuarioActivo.set(usuario);
  }

  setMenuItemActivo(item: MenuItemActivo): void {
    this._menuItemActivo.set(item);
  }

  setCatalogoActivo(slug: string): void {
    this._catalogoActivo.set(slug);
  }

  setSidebarIconActivo(iconId: string): void {
    this._sidebarIconActivo.set(iconId);
  }

  cerrarSesion(): void {
    this._usuarioActivo.set(null);
    this._menuItemActivo.set(null);
    this._catalogoActivo.set(null);
  }
}
