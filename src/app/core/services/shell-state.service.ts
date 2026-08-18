import { Injectable, signal, computed } from '@angular/core';
import type { UsuarioActivo, MenuItemActivo } from '../interfaces/shell-state.model';

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
  private readonly _sidebarIconActivo = signal<string>('host-inicio');
  private readonly _cerrandoSesion = signal(false);
  // Arranca colapsado: la navegación dentro de un sistema pasó al explorador
  // de archivos del área de contenido (`ExploradorSistemaComponent`), y este
  // panel quedó como pane opcional que el usuario abre con el botón de menú.
  private readonly _navPanelColapsado = signal(true);
  private readonly _contenidoPendienteSeleccion = signal(false);

  // ─── Signals de solo lectura (expuestos — Remotes solo leen) ────────────

  /** Usuario autenticado actualmente. */
  readonly usuarioActivo = this._usuarioActivo.asReadonly();

  /** Ítem del menú principal actualmente seleccionado. */
  readonly menuItemActivo = this._menuItemActivo.asReadonly();

  /** ID del ícono activo en la Col 1 del sidebar. */
  readonly sidebarIconActivo = this._sidebarIconActivo.asReadonly();

  /**
   * True mientras se muestra la pantalla de carga de "Cerrando sesión…".
   * Se lee desde `AppComponent` (raíz) para renderizar el overlay fuera de
   * cualquier ancestro con `backdrop-filter`/`transform` (rompen `position: fixed`).
   */
  readonly cerrandoSesion = this._cerrandoSesion.asReadonly();

  /**
   * True cuando el panel de navegación (Col 2 del sidebar) está colapsado.
   * Compartido entre `SidebarComponent` (dueño del panel) y `HeaderComponent`
   * (botón para alternarlo en mobile): ambos necesitan leer/mutar el mismo
   * estado sin ser padre/hijo entre sí.
   */
  readonly navPanelColapsado = this._navPanelColapsado.asReadonly();

  /**
   * True mientras se cambió a un sistema con panel propio (Col 2) pero el
   * usuario todavía no eligió un sub-ítem — `SidebarComponent` lo enciende al
   * cambiar de sistema y lo apaga cuando el `Router` termina de navegar.
   * `ShellLayoutComponent` lo lee para ocultar el `<router-outlet>` (que
   * todavía tiene montada la pantalla del sistema anterior) y mostrar un
   * loader en su lugar, en vez de dejar ver contenido de otro módulo.
   */
  readonly contenidoPendienteSeleccion = this._contenidoPendienteSeleccion.asReadonly();

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

  setSidebarIconActivo(iconId: string): void {
    this._sidebarIconActivo.set(iconId);
  }

  setCerrandoSesion(valor: boolean): void {
    this._cerrandoSesion.set(valor);
  }

  toggleNavPanel(): void {
    this._navPanelColapsado.update((colapsado) => !colapsado);
  }

  setNavPanelColapsado(valor: boolean): void {
    this._navPanelColapsado.set(valor);
  }

  setContenidoPendienteSeleccion(valor: boolean): void {
    this._contenidoPendienteSeleccion.set(valor);
  }

  cerrarSesion(): void {
    this._usuarioActivo.set(null);
    this._menuItemActivo.set(null);
    this._cerrandoSesion.set(false);
  }
}
