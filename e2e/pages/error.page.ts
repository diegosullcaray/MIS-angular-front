import type { Page } from '@playwright/test';

/** Página genérica de error HTTP (`/error/:code`, ver `error-page.component.ts`). */
export class ErrorPage {
  constructor(private readonly page: Page) {}

  async ir(codigo: number): Promise<void> {
    await this.page.goto(`/error/${codigo}`);
  }

  get titulo() {
    return this.page.getByRole('heading', { level: 1 });
  }

  get codigo() {
    return this.page.locator('.text-5xl');
  }

  botonAccion(etiqueta: string) {
    return this.page.getByRole('button', { name: etiqueta });
  }
}
