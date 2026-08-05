import type { Page } from '@playwright/test';

/** Login del Host (`/login`, ver `login.component.ts`). */
export class LoginPage {
  constructor(private readonly page: Page) {}

  async ir(): Promise<void> {
    await this.page.goto('/login');
  }

  get botonGoogle() {
    return this.page.getByRole('button', { name: /continuar con google/i });
  }
}
