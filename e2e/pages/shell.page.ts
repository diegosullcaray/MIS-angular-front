import type { Page } from '@playwright/test';

/**
 * Shell autenticado (header + sidebar, ver `shell-layout.component.html`).
 * Requiere una sesión inyectada (`inyectarSesionVigente`) y el backend
 * mockeado (`mockearBackendAnt`) antes de navegar — ver `fixtures/session.ts`.
 */
export class ShellPage {
  constructor(private readonly page: Page) {}

  async ir(ruta = '/app/dashboard'): Promise<void> {
    await this.page.goto(ruta);
  }

  /** Aside de Col 1 (íconos de sistemas) — barra inferior fija en mobile, rail vertical en desktop. */
  get railIconos() {
    return this.page.locator('#tour-sidebar-icons');
  }

  get botonHamburguesaDelRail() {
    return this.railIconos.getByRole('button', { name: 'Alternar menú lateral' });
  }

  get botonHamburguesaDelHeader() {
    return this.page.locator('header').getByRole('button', { name: 'Alternar menú lateral' });
  }

  get breadcrumb() {
    return this.page.locator('.header-breadcrumb');
  }

  /** Pill de usuario del header (abre/cierra el dropdown de perfil) — el nombre/rol se ocultan en mobile, por eso no se busca por accesible-name. */
  get botonMenuUsuario() {
    return this.page.locator('header [role="button"][aria-haspopup="true"]');
  }

  /** Panel del dropdown de perfil (info de usuario + acciones) — ver `header.component.html`. */
  get dropdownUsuario() {
    return this.page.locator('[role="menu"]');
  }

  get panelNavegacion() {
    return this.page.locator('#tour-sidebar-panel');
  }

  /** Contenedor raíz del shell (ver `shell-layout.component.html`) — el selector usa solo clases simples, no las de fondo (que traen paréntesis/comillas). */
  get raiz() {
    return this.page.locator('div.h-screen.flex.overflow-hidden');
  }

  /** URL del wallpaper actualmente aplicado (mobile: wallpaper_cell.png, desktop: wallpaper.png — ver clases responsive de la raíz). */
  async wallpaperAplicado(): Promise<string> {
    return this.raiz.evaluate((el) => getComputedStyle(el).backgroundImage);
  }

  /** Fondo oscuro que bloquea toda la pantalla (header incluido) mientras Col 2 está abierta en mobile — ver `sidebar.component.html`. */
  get fondoOscuroPanel() {
    return this.page.locator('[aria-hidden="true"].fixed.inset-0');
  }

  /**
   * En mobile, Col 2 (panel de navegación) arranca abierta al entrar y su
   * fondo oscuro tapa el header entero — igual que un drawer nativo, primero
   * hay que descartarlo (tocar el fondo) antes de poder usar el header. En
   * desktop no existe ese fondo, así que no hace nada.
   *
   * No se puede resolver con un `isVisible()` inmediato: el fondo recién
   * existe una vez que Angular hidrata la página, así que un chequeo
   * disparado justo después de `goto()` casi siempre lo encuentra ausente
   * todavía — se espera (`waitFor`) en vez de solo consultar el estado actual.
   */
  async cerrarPanelSiEstaTapandoElHeader(): Promise<void> {
    const anchoViewport = this.page.viewportSize()?.width ?? 1280;
    const esMobil = anchoViewport < 640;
    if (!esMobil) return;

    await this.fondoOscuroPanel.waitFor({ state: 'visible' });
    // El panel (`#tour-sidebar-panel`, z-50) se superpone al fondo en su
    // franja izquierda (w-[85vw]) y tapa el centro del viewport — hay que
    // clickear el fondo fuera de esa franja, cerca del borde derecho.
    await this.fondoOscuroPanel.click({ position: { x: anchoViewport - 10, y: 20 } });
  }
}
