import type { Page } from '@playwright/test';

/**
 * Aborta cualquier llamada real a Google (discovery document / OIDC) para
 * que `completarLoginGoogle()` falle rápido y determinístico en vez de
 * esperar una respuesta de red real — ver `auth.service.ts`.
 */
export async function bloquearGoogle(page: Page): Promise<void> {
  await page.route('https://accounts.google.com/**', (route) => route.abort());
}
