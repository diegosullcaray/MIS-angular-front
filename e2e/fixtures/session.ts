import type { Page } from '@playwright/test';

/** Misma clave que usa `AuthService` (ver `src/app/pages/full-pages/auth/service/auth.service.ts`). */
export const SESSION_STORAGE_KEY = 'mis.sesion';

export const QUINCE_MINUTOS_MS = 15 * 60 * 1000;

export interface UsuarioDePrueba {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  subsistemas: string[];
}

export const USUARIO_DE_PRUEBA: UsuarioDePrueba = {
  id: 'e2e-user',
  nombre: 'Usuario E2E',
  email: 'e2e.playwright@confianza.pe',
  rol: 'admin-sistema',
  subsistemas: [],
};

/**
 * Inyecta una sesión ya autenticada en `sessionStorage` antes de que la app
 * arranque (`addInitScript` corre antes que cualquier script de la página).
 * Evita depender de un login real contra Google + el backend Ant en los E2E.
 */
async function inyectarSesion(page: Page, expiraEn: number): Promise<void> {
  await page.addInitScript(
    ({ key, usuario, expiraEn }) => {
      window.sessionStorage.setItem(key, JSON.stringify({ token: 'e2e-fake-token', usuario, expiraEn }));
    },
    { key: SESSION_STORAGE_KEY, usuario: USUARIO_DE_PRUEBA, expiraEn }
  );
}

/** Sesión válida por los 15 minutos completos — para specs del shell autenticado. */
export async function inyectarSesionVigente(page: Page): Promise<void> {
  await inyectarSesion(page, Date.now() + QUINCE_MINUTOS_MS);
}

/** Sesión ya vencida — para el spec de expiración (`session-expiry.spec.ts`). */
export async function inyectarSesionExpirada(page: Page): Promise<void> {
  await inyectarSesion(page, Date.now() - 1_000);
}

/**
 * Responde con éxito vacío a cualquier llamada al backend Ant/Winder
 * (`environment.requestConfigRootURL`, ver `rest-packet.class.ts`), para que
 * el shell autenticado (sidebar/header) renderice sin depender de un backend
 * real. Sin esto, la petición fallida dispara el interceptor global de
 * errores fatales y redirige a `/error/0` ("Sin conexión").
 */
export async function mockearBackendAnt(page: Page): Promise<void> {
  await page.route('**/cores2/ant/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ code: '0', headers: {}, body: {} }),
    })
  );
}
