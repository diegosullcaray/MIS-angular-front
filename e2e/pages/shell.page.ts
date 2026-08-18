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
   * En mobile, Col 2 (panel de navegación) es un drawer con fondo oscuro que
   * tapa el header entero mientras está abierta — hay que descartarla (tocar
   * el fondo) antes de poder usar el header. Ya NO arranca abierta al entrar
   * (la navegación de un sistema vive en el explorador del área de
   * contenido; Col 2 es un pane opcional, colapsado por defecto — ver
   * `ShellStateService.navPanelColapsado`), así que lo normal es que este
   * fondo nunca aparezca: se prueba con un timeout corto en vez de esperar
   * indefinidamente, y no hace nada si no aparece. En desktop no existe ese
   * fondo, así que tampoco hace nada.
   */
  async cerrarPanelSiEstaTapandoElHeader(): Promise<void> {
    const anchoViewport = this.page.viewportSize()?.width ?? 1280;
    const esMobil = anchoViewport < 640;
    if (!esMobil) return;

    const abierta = await this.fondoOscuroPanel
      .waitFor({ state: 'visible', timeout: 1000 })
      .then(() => true)
      .catch(() => false);
    if (!abierta) return;

    // El panel (`#tour-sidebar-panel`, z-50) se superpone al fondo en su
    // franja izquierda (w-[85vw]) y tapa el centro del viewport — hay que
    // clickear el fondo fuera de esa franja, cerca del borde derecho.
    await this.fondoOscuroPanel.click({ position: { x: anchoViewport - 10, y: 20 } });
  }
}
