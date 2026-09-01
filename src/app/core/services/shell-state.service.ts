import { Injectable, signal, computed } from '@angular/core';
import type { UsuarioActivo, MenuItemActivo } from '../interfaces/shell-state.model';

/** Contrato Host ↔ Remote (RN-03): el Host muta los signals privados y los Remotes solo leen los `asReadonly()`. */
@Injectable({ providedIn: 'root' })
export class ShellStateService {
  private readonly _usuarioActivo = signal<UsuarioActivo | null>(null);
  private readonly _menuItemActivo = signal<MenuItemActivo | null>(null);
  private readonly _sidebarIconActivo = signal<string>('host-inicio');
  private readonly _cerrandoSesion = signal(false);
  private readonly _contenidoPendienteSeleccion = signal(false);
  private readonly _railSuperpuestoAbierto = signal(false);

  /** Usuario autenticado actualmente. */
  readonly usuarioActivo = this._usuarioActivo.asReadonly();

  /** Ítem del menú principal actualmente seleccionado. */
  readonly menuItemActivo = this._menuItemActivo.asReadonly();

  /** ID del ícono activo en la Col 1 del sidebar. */
  readonly sidebarIconActivo = this._sidebarIconActivo.asReadonly();

  /** Muestra el overlay de "Cerrando sesión…"; lo lee `AppComponent` para pintarlo fuera de ancestros con `backdrop-filter`/`transform`, que rompen `position: fixed`. */
  readonly cerrandoSesion = this._cerrandoSesion.asReadonly();

  /** Solo aplica al modo de menú `superpuesto`: si el rail de sistemas está desplegado sobre el contenido. En los otros modos el rail es fijo y esto no se mira. */
  readonly railSuperpuestoAbierto = this._railSuperpuestoAbierto.asReadonly();

  /** Se cambió de sistema pero aún no se eligió sub-ítem: el shell oculta el `<router-outlet>` (que sigue mostrando el sistema anterior) y pinta un loader. */
  readonly contenidoPendienteSeleccion = this._contenidoPendienteSeleccion.asReadonly();

  /** True si el usuario puede gestionar IAM (usuarios, roles). */
  readonly esAdminSistema = computed(
    () => this._usuarioActivo()?.rol === 'admin-sistema'
  );

  /** True si el usuario tiene acceso operativo completo (admin-general o admin-sistema). */
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

  setUsuarioActivo(usuario: UsuarioActivo): void {
    this._usuarioActivo.set(usuario);
  }

  setMenuItemActivo(item: MenuItemActivo): void {
    this._menuItemActivo.set(item);
  }

  setSidebarIconActivo(iconId: string): void {
    this._sidebarIconActivo.set(iconId);
  }

  setCerrandoSesion(valor: boolean): void {
    this._cerrandoSesion.set(valor);
  }

  setContenidoPendienteSeleccion(valor: boolean): void {
    this._contenidoPendienteSeleccion.set(valor);
  }

  setRailSuperpuestoAbierto(valor: boolean): void {
    this._railSuperpuestoAbierto.set(valor);
  }

  cerrarSesion(): void {
    this._usuarioActivo.set(null);
    this._menuItemActivo.set(null);
    this._cerrandoSesion.set(false);
    this._railSuperpuestoAbierto.set(false);
  }
}
