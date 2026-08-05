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

  get panelNavegacion() {
    return this.page.locator('#tour-sidebar-panel');
  }
}
