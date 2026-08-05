import type { Page } from '@playwright/test';

/** Página comodín para rutas inexistentes (`**`, ver `not-found.component.ts`). */
export class NotFoundPage {
  constructor(private readonly page: Page) {}

  get titulo() {
    return this.page.getByRole('heading', { level: 1 });
  }

  get enlaceVolver() {
    return this.page.getByRole('link', { name: /volver al inicio/i });
  }
}
