import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import {
  QUINCE_MINUTOS_MS,
  SESSION_STORAGE_KEY,
  USUARIO_DE_PRUEBA,
  inyectarSesionVigente,
  mockearBackendAnt,
} from './fixtures/session';

/**
 * Smoke test del módulo "incentivos" (Cuadro de Mando de Incentivos,
 * `/app/incentivos3`): confirma que la pantalla renderiza sin errores de
 * consola. El usuario de prueba tiene rol `admin-sistema` (ver
 * `fixtures/session.ts`), que `ShellStateService.esAdmin()` resuelve como
 * admin — mismo camino que el legado STAFF (ver nota de gap de datos en
 * `IncentivosService`) — así que el selector de nivel se abre solo y de
 * forma obligatoria (`requiereSeleccionInicial`), sin fondo del Cuadro de
 * Mando todavía. Sin datos reales del backend (mockeado con éxito vacío),
 * la lógica de negocio ya está cubierta a nivel unitario.
 */
test.describe('Incentivos — smoke del Cuadro de Mando', () => {
  test.beforeEach(async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
  });

  test('/app/incentivos3 renderiza sin errores de consola', async ({ page }) => {
    const erroresConsola: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') erroresConsola.push(msg.text());
    });
    page.on('pageerror', (err) => erroresConsola.push(err.message));

    await page.goto('/app/incentivos3');
    await page.waitForLoadState('networkidle');

    expect(erroresConsola).toEqual([]);
  });

  test('con un usuario admin, abre el selector de nivel automáticamente y exige elegir uno', async ({ page }) => {
    await page.goto('/app/incentivos3');

    const dialogo = page.getByRole('dialog', { name: 'Selecciona Nivel' });
    await expect(dialogo).toBeVisible();
    await expect(page.getByRole('button', { name: 'Asesores' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unidades' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Corredores' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Territorios' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'FC Individual' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'FC Grupal' })).toBeVisible();

    // El primer selector se puede cerrar: sin perfil, cerrar lleva al dashboard.
    await expect(dialogo.getByRole('button', { name: 'Cerrar y volver al inicio' })).toBeVisible();
  });

  test('elegir "Asesores" muestra el buscador de colaboradores y un botón "Seleccionar" deshabilitado hasta elegir una fila', async ({ page }) => {
    await page.goto('/app/incentivos3');
    await page.getByRole('button', { name: 'Asesores' }).click();

    // El buscador es ahora el de `app-data-table`, con su propio texto guía.
    await expect(page.getByPlaceholder('Buscar por asesor, unidad, corredor o territorio...')).toBeVisible();
    // `exact` porque la barra de la ventana tiene su propio "Seleccionar nivel".
    await expect(page.getByRole('button', { name: 'Seleccionar', exact: true })).toBeDisabled();
  });
});

test.describe('Incentivos — selector de nivel en teléfono', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(async ({ page }) => {
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
  });

  /**
   * En teléfono se ocultaban Corredor y Territorio (`mobileVisible: false`), y
   * sin ellas no se distingue a dos asesores de igual nombre. Ahora se ven las
   * cuatro columnas de escritorio y la tabla se desplaza dentro del diálogo.
   */
  test('la lista de asesores muestra las mismas cuatro columnas que en escritorio, sin desbordar la pantalla', async ({ page }) => {
    await page.goto('/app/incentivos3');
    const dialogo = page.getByRole('dialog', { name: 'Selecciona Nivel' });
    await dialogo.getByRole('button', { name: 'Asesores' }).click();

    for (const columna of ['Asesor', 'Unidad', 'Corredor', 'Territorio']) {
      await expect(dialogo.getByRole('columnheader', { name: columna })).toBeVisible();
    }

    // El diálogo entra en la pantalla; lo que no cabe se desplaza dentro de él.
    const caja = (await dialogo.boundingBox())!;
    expect(caja.x).toBeGreaterThanOrEqual(0);
    expect(caja.x + caja.width).toBeLessThanOrEqual(375);
    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(desborde).toBeLessThanOrEqual(1);
  });
});

/**
 * Cuadro de Mando con datos, en teléfono, tablet y escritorio: todo entra en el ancho de la
 * pantalla y los colores son los del legado (`modules/incentivos3`).
 */
const RESULTADOS = {
  ds1: [],
  ds2: [],
  // Avances: meta cumplida (verde), 70 % (ámbar) y 30 % (magenta).
  ds3: {
    car_avan_fix: 1.05, car_avan_floor: 100,
    cli_avan_fix: 0.7, cli_avan_floor: 70,
    efec1_avan_fix: 0.3, efec1_avan_floor: 30,
    efec2_avan_fix: 0.9, efec2_avan_floor: 90,
    efec3_avan_fix: 0.5, efec3_avan_floor: 50,
  },
  // Semáforo: 0 no cumple (rojo), 1 cumple (verde), otro sin evaluar (gris).
  ds4: {
    flag_car: 1, flag_cli: 0, flag_efec1: 2, flag_efec2: 1, flag_efec3: 0, flag_act: 1,
    bob_car: 350, bop_car: 120, bos_prod: 80, bos_clib: -20, bos_ret: 0, bos_tas: 15,
  },
};

async function sesionConCuadroDeMando(page: Page) {
  await inyectarSesionVigente(page);
  // Un asesor (nivel CARGO) entra directo a su propio Cuadro de Mando, sin el selector.
  await page.addInitScript(
    ({ key, usuario, expiraEn }) => {
      window.sessionStorage.setItem(key, JSON.stringify({ token: 'e2e-fake-token', usuario, expiraEn }));
    },
    {
      key: SESSION_STORAGE_KEY,
      usuario: { ...USUARIO_DE_PRUEBA, nivelIncentivos: 'CARGO', claUse: 1, fechaCorte: '20260924', cargo: 'Asesor de Negocios' },
      expiraEn: Date.now() + QUINCE_MINUTOS_MS,
    },
  );
  await page.route('**/cores2/ant/**', (route) => {
    const strands = route.request().headers()['winder-params'] ?? '';
    const body = strands.includes('resultados') ? { resultado: RESULTADOS } : {};
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) });
  });
}

async function desbordeHorizontal(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

for (const [nombre, ancho, alto] of [['teléfono', 375, 812], ['tablet', 768, 1024]] as const) {
  test.describe(`Incentivos — Cuadro de Mando en ${nombre} (${ancho} px)`, () => {
    test.use({ viewport: { width: ancho, height: alto } });

    test('todo entra en el ancho de la pantalla y el semáforo muestra solo íconos', async ({ page }) => {
      await sesionConCuadroDeMando(page);
      await page.goto('/app/incentivos3');
      await expect(page.locator('.semaforo-chip').first()).toBeVisible();

      expect(await desbordeHorizontal(page)).toBeLessThanOrEqual(1);
      for (const selector of ['.perfil', '.semaforo-chip', '.avance', '.super-plus-item', '.monetizado']) {
        for (const caja of await page.locator(selector).all()) {
          const b = (await caja.boundingBox())!;
          expect(b.x).toBeGreaterThanOrEqual(0);
          expect(b.x + b.width).toBeLessThanOrEqual(ancho + 1);
        }
      }

      // `fxHide.lt-md` del legado: por debajo de 960 px el nombre no se ve, queda en el tooltip.
      await expect(page.locator('.semaforo-texto').first()).toBeHidden();
      await expect(page.locator('.semaforo-chip').first()).toHaveAttribute('title', /: (cumple|no cumple|sin evaluar)$/);
    });
  });
}

test.describe('Incentivos — colores por tema', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  async function colores(page: Page) {
    const colorIcono = (titulo: RegExp) =>
      page.locator('.semaforo-chip', { has: page.locator('.semaforo-texto', { hasText: titulo }) }).locator('.semaforo-icono')
        .evaluate((el) => getComputedStyle(el).color);
    return {
      bien: await colorIcono(/^Cartera/),
      mal: await colorIcono(/^Clientes/),
      anillos: (await page.locator('.avance-anillo').evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundImage))).join(' '),
      superPlus: await page.locator('.super-plus-item').evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundColor)),
      monto: await page.locator('.monetizado-cifra--total').evaluate((el) => getComputedStyle(el).color),
    };
  }

  test('en claro usa la paleta del sistema; en oscuro conserva la de incentivos3', async ({ page }) => {
    await sesionConCuadroDeMando(page);
    await page.goto('/app/incentivos3');
    await expect(page.locator('.semaforo-chip').first()).toBeVisible();
    // En escritorio el semáforo sí lleva el nombre.
    await expect(page.locator('.semaforo-texto').first()).toBeVisible();

    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    const claro = await colores(page);
    expect(claro.bien).toBe('rgb(17, 128, 58)'); // --mis-success #11803a
    expect(claro.mal).toBe('rgb(211, 36, 36)'); // --mis-danger  #d32424
    expect(claro.anillos).toContain('rgb(17, 128, 58)'); // meta
    expect(claro.anillos).toContain('rgb(217, 119, 6)'); // 65-100
    expect(claro.anillos).toContain('rgb(211, 36, 36)'); // < 65
    expect(claro.superPlus).toContain('rgb(3, 80, 150)'); // --mis-primary #035096
    expect(claro.monto).toBe('rgb(3, 80, 150)');
    // Ningún tono saturado del legado queda en claro.
    const todo = JSON.stringify(claro);
    for (const legado of ['rgb(63, 233, 30)', 'rgb(227, 0, 91)', 'rgb(0, 159, 227)', 'rgb(59, 209, 54)']) {
      expect(todo).not.toContain(legado);
    }

    await page.evaluate(() => document.documentElement.classList.add('dark'));
    const oscuro = await colores(page);
    expect(oscuro.bien).toBe('rgb(59, 209, 54)'); // .am #3bd136
    expect(oscuro.mal).toBe('rgb(233, 30, 47)'); // .dm #e91e2f
    expect(oscuro.anillos).toContain('rgb(63, 233, 30)'); // #3fe91e
    expect(oscuro.superPlus).toContain('rgb(0, 159, 227)'); // bg1 #009fe3
    expect(oscuro.monto).toBe('rgb(0, 159, 227)');
  });
});

test.describe('Incentivos — tablas del mes solo desde tablet', () => {
  for (const [nombre, ancho, visibles] of [['teléfono', 375, false], ['tablet', 768, true], ['escritorio', 1280, true]] as const) {
    test(`en ${nombre} (${ancho} px) las tablas ${visibles ? 'se muestran' : 'se ocultan'}`, async ({ page }) => {
      await page.setViewportSize({ width: ancho, height: 900 });
      await sesionConCuadroDeMando(page);
      await page.goto('/app/incentivos3');
      await expect(page.locator('.semaforo-chip').first()).toBeVisible();

      const tablas = page.getByRole('region', { name: 'Variables del mes' });
      if (visibles) {
        await expect(tablas).toBeVisible();
      } else {
        await expect(tablas).toBeHidden();
        // El resto del tablero sigue en pie.
        await expect(page.getByRole('region', { name: 'Avance de metas' })).toBeVisible();
        await expect(page.getByRole('region', { name: 'Bonos Super Plus' })).toBeVisible();
      }
    });
  }
});
