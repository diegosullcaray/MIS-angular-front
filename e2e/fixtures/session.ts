import type { Page } from '@playwright/test';

/** Misma clave que usa `AuthService` (ver `src/app/pages/full-pages/auth/service/auth.service.ts`). */
export const SESSION_STORAGE_KEY = 'mis.sesion';

/** Misma clave que usa `PreferenciasLocalStorageRepositorio`. */
export const PREFERENCIAS_STORAGE_KEY = 'mis.preferencias';

export const QUINCE_MINUTOS_MS = 15 * 60 * 1000;

export interface UsuarioDePrueba {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  subsistemas: string[];
  codBt: string;
}

export const USUARIO_DE_PRUEBA: UsuarioDePrueba = {
  id: 'e2e-user',
  nombre: 'Usuario E2E',
  email: 'e2e.playwright@confianza.pe',
  rol: 'admin-sistema',
  subsistemas: [],
  // Con codBt, KaypachaService.cargarCategorias() (se dispara siempre desde el
  // constructor de SidebarComponent, en cualquier página autenticada) no cae en
  // su rama de error por falta de cod_bt — evita ruido de consola irrelevante
  // en specs que no tienen nada que ver con ranking-k.
  codBt: 'BT-001',
};

/** Un usuario alterno tal como lo expone `AuthService.alternates()` (ver `alternate-usuario.model.ts`). */
export interface AlternateDePrueba {
  email: string;
  nombre: string;
  cargo?: string;
}

/**
 * Inyecta una sesión ya autenticada en `sessionStorage` antes de que la app
 * arranque (`addInitScript` corre antes que cualquier script de la página).
 * Evita depender de un login real contra Google + el backend Ant en los E2E.
 */
async function inyectarSesion(
  page: Page,
  expiraEn: number,
  extra: { alternates?: AlternateDePrueba[]; usuarioOriginal?: UsuarioDePrueba } = {}
): Promise<void> {
  await page.addInitScript(
    ({ key, usuario, expiraEn, extra }) => {
      window.sessionStorage.setItem(key, JSON.stringify({ token: 'e2e-fake-token', usuario, expiraEn, ...extra }));
    },
    { key: SESSION_STORAGE_KEY, usuario: USUARIO_DE_PRUEBA, expiraEn, extra }
  );
}

/**
 * Sesión válida por los 15 minutos completos — para specs del shell autenticado.
 * Silencia además los comunicados: si no, su diálogo modal se abriría encima y
 * taparía lo que el spec viene a probar (ver `inyectarPreferencias`).
 */
export async function inyectarSesionVigente(page: Page): Promise<void> {
  await inyectarSesionSinPreferencias(page);
  await inyectarPreferencias(page);
}

/**
 * La misma sesión vigente pero SIN sembrar preferencias, es decir con el
 * `localStorage` limpio: es lo que ve un usuario que entra por primera vez.
 * Lo usa `comunicados.spec.ts`, el único que necesita que el diálogo se abra.
 */
export async function inyectarSesionSinPreferencias(page: Page): Promise<void> {
  await inyectarSesion(page, Date.now() + QUINCE_MINUTOS_MS);
}

/**
 * Preferencias de interfaz sembradas antes de que arranque la app.
 *
 * Se usa sobre todo para una cosa: **silenciar los comunicados**. El diálogo de
 * anuncios se abre solo en el primer ingreso de un usuario, y con un
 * `localStorage` limpio —que es lo que ve cada test— eso significa que se abre
 * en TODOS. Su máscara modal tapa el header y el sidebar, así que sin esto
 * cualquier spec del shell fallaría por un motivo que no está probando.
 *
 * El spec que sí prueba los comunicados (`comunicados.spec.ts`) no llama a esto
 * y por eso los ve, igual que un usuario que entra por primera vez.
 */
export async function inyectarPreferencias(
  page: Page,
  preferencias: Record<string, unknown> = { anuncios: { vistos: [], silenciar: true } }
): Promise<void> {
  await page.addInitScript(
    ({ key, preferencias }) => {
      window.localStorage.setItem(key, JSON.stringify(preferencias));
    },
    { key: PREFERENCIAS_STORAGE_KEY, preferencias }
  );
}


/**
 * Sesión vigente con usuarios alternos asignados (ver `AuthService.alternates`
 * / diálogo "Cambiar usuario") — para el spec de cambio de usuario.
 */
export async function inyectarSesionConAlternates(page: Page, alternates: AlternateDePrueba[]): Promise<void> {
  await inyectarSesion(page, Date.now() + QUINCE_MINUTOS_MS, { alternates });
  await inyectarPreferencias(page);
}

/**
 * Sesión vigente ya "viendo como" un usuario alterno (`usuarioOriginal`
 * presente) — simula haber usado "Cambiar usuario" antes del refresh, sin
 * depender de una llamada real al backend (ver `AuthService.restaurarSesion`).
 */
export async function inyectarSesionComoAlterno(
  page: Page,
  alterno: UsuarioDePrueba,
  alternates: AlternateDePrueba[] = []
): Promise<void> {
  await page.addInitScript(
    ({ key, usuario, usuarioOriginal, alternates, expiraEn }) => {
      window.sessionStorage.setItem(
        key,
        JSON.stringify({ token: 'e2e-fake-token', usuario, usuarioOriginal, alternates, expiraEn })
      );
    },
    {
      key: SESSION_STORAGE_KEY,
      usuario: alterno,
      usuarioOriginal: USUARIO_DE_PRUEBA,
      alternates,
      expiraEn: Date.now() + QUINCE_MINUTOS_MS,
    }
  );
  await inyectarPreferencias(page);
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
