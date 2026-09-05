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

  /**
   * Fija el tema antes de que arranque la app. El tema vive en las preferencias
   * (`PreferenciasService`), no en una clave propia: `ThemeService` solo lo
   * aplica. Se conservan los comunicados silenciados, como en
   * `inyectarSesionVigente`. Sin esto se usa el default, que es oscuro.
   */
  async fijarTema(modo: 'claro' | 'oscuro'): Promise<void> {
    await this.page.addInitScript(
      (m) =>
        localStorage.setItem(
          'mis.preferencias',
          JSON.stringify({ apariencia: { tema: m }, anuncios: { vistos: [], silenciar: true } })
        ),
      modo
    );
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

  /** Contenedor raíz del shell (ver `shell-layout.component.html`) — el selector usa solo clases simples, no las de fondo (que traen paréntesis/comillas). */
  get raiz() {
    return this.page.locator('div.h-screen.flex.overflow-hidden');
  }

  /** URL del wallpaper aplicado — lo resuelve `--mis-wallpaper` según ancho y tema (ver `tokens.css`). */
  async wallpaperAplicado(): Promise<string> {
    return this.raiz.evaluate((el) => getComputedStyle(el).backgroundImage);
  }

  /** Color del velo que va sobre el wallpaper (`shell-wallpaper::before`) — `rgba(0, 0, 0, 0)` cuando está apagado. */
  async veloWallpaper(): Promise<string> {
    return this.raiz.evaluate((el) => getComputedStyle(el, '::before').backgroundColor);
  }

  /**
   * Col 2 (el antiguo panel de navegación de la Col 2, con su fondo oscuro
   * en mobile) ya no existe: la navegación de un sistema vive enteramente en
   * el explorador del área de contenido — ver `sidebar.component.html`. Este
   * método queda como no-op para no tener que tocar los specs que todavía lo
   * llaman defensivamente antes de interactuar con el header.
   */
  async cerrarPanelSiEstaTapandoElHeader(): Promise<void> {
    return;
  }
}
