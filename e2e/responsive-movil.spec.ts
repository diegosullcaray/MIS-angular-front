import { test, expect } from '@playwright/test';
import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';
import { DISPOSITIVOS, TELEFONOS } from './fixtures/dispositivos';
import { buscarDesbordes, paginaDesbordaEnHorizontal, objetivosTactilesChicos } from './fixtures/desbordes';

/**
 * Responsive en móviles reales (Android e iOS).
 *
 * jsdom no calcula layout, así que un test unitario no puede ver un desborde:
 * esto corre en un navegador de verdad, a los viewports reales de la matriz de
 * `fixtures/dispositivos.ts`.
 *
 * La regla es una sola y dura: **ninguna pantalla puede tener scroll
 * horizontal**. Una tabla ancha se resuelve con su propio contenedor
 * desplazable, no empujando la página.
 */

/** Las pantallas que un usuario abre primero y que más elementos meten en pantalla. */
const PANTALLAS = [
  { nombre: 'Dashboard', ruta: '/app/dashboard' },
  { nombre: 'Explorador de reportes', ruta: '/app/reportes' },
  { nombre: 'Actividades', ruta: '/app/actividades' },
  { nombre: 'Base negativa', ruta: '/app/cons_base_negativa' },
] as const;

test.describe('Sin scroll horizontal en ningún teléfono', () => {
  for (const dispositivo of TELEFONOS) {
    for (const pantalla of PANTALLAS) {
      test(`${dispositivo.nombre} (${dispositivo.ancho}px, ${dispositivo.so}) · ${pantalla.nombre}`, async ({
        page,
      }) => {
        await page.setViewportSize({ width: dispositivo.ancho, height: dispositivo.alto });
        await inyectarSesionVigente(page);
        await mockearBackendAnt(page);

        await page.goto(pantalla.ruta);
        await expect(page.locator('#tour-sidebar-icons')).toBeVisible();
        // La barra inferior de móvil se monta después del primer render.
        await page.waitForTimeout(300);

        // La aserción dura es a nivel de PÁGINA: que no aparezca la barra de
        // scroll horizontal. Un elemento más ancho que la pantalla dentro de su
        // contenedor desplazable (una tabla de reporte, por ejemplo) es la
        // solución esperada, no un defecto. Los elementos se listan solo para
        // ubicar la causa cuando la página sí desborda.
        const desborda = await paginaDesbordaEnHorizontal(page);
        const culpables = desborda ? await buscarDesbordes(page) : [];
        expect(culpables, `${pantalla.nombre} @ ${dispositivo.ancho}px empuja la página`).toEqual([]);
        expect(desborda, `scroll horizontal en ${pantalla.nombre} @ ${dispositivo.ancho}px`).toBe(false);
      });
    }
  }
});

test.describe('El shell en el ancho más chico del mercado', () => {
  const fold = TELEFONOS[0];

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: fold.ancho, height: fold.alto });
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
  });

  test('el rail de sistemas es la barra inferior, no la columna lateral', async ({ page }) => {
    await page.goto('/app/dashboard');
    const rail = page.locator('#tour-sidebar-icons');
    await expect(rail).toBeVisible();

    const caja = (await rail.boundingBox())!;
    // En móvil el rail va abajo, a todo el ancho: si estuviera de columna, se
    // comería la mitad de los 280px.
    expect(caja.width).toBeGreaterThanOrEqual(fold.ancho - 1);
    expect(caja.y).toBeGreaterThan(fold.alto / 2);
  });

  test('el header entra completo, sin comerse el breadcrumb', async ({ page }) => {
    await page.goto('/app/dashboard');
    const header = page.locator('header').first();
    const caja = (await header.boundingBox())!;

    expect(Math.round(caja.width)).toBeLessThanOrEqual(fold.ancho);
    expect(caja.x).toBeGreaterThanOrEqual(-1);
  });

  test('el contenido no queda tapado por la barra inferior fija', async ({ page }) => {
    await page.goto('/app/dashboard');
    await expect(page.locator('#tour-sidebar-icons')).toBeVisible();

    // El shell reserva espacio abajo (`pb-16`) justamente para que la barra fija
    // no se coma la última fila. Se compara contra el alto REAL del rail, que es
    // lo que importa, y no contra un número mágico.
    const { finDelContenido, inicioDelRail } = await page.evaluate(() => {
      const main = document.querySelector('main')!;
      const rail = document.querySelector('#tour-sidebar-icons')!;
      return {
        finDelContenido: Math.round(main.getBoundingClientRect().bottom),
        inicioDelRail: Math.round(rail.getBoundingClientRect().top),
      };
    });
    expect(finDelContenido).toBeLessThanOrEqual(inicioDelRail);
  });
});

test.describe('Diálogos en móvil', () => {
  const telefono = TELEFONOS[1];

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: telefono.ancho, height: telefono.alto });
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
  });

  test('el diálogo de configuración entra en el ancho del teléfono', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.locator('header [role="button"][aria-haspopup="true"]').click();
    await page.getByRole('menuitem', { name: 'Configuración' }).click();

    const dialogo = page.getByRole('dialog').filter({ hasText: 'Configuración' });
    await expect(dialogo).toBeVisible();

    const caja = (await dialogo.boundingBox())!;
    expect(Math.round(caja.width)).toBeLessThanOrEqual(telefono.ancho);
    expect(caja.x).toBeGreaterThanOrEqual(-1);
    expect(await paginaDesbordaEnHorizontal(page)).toBe(false);
  });
});

test.describe('Objetivos táctiles', () => {
  const telefono = TELEFONOS[1];

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: telefono.ancho, height: telefono.alto });
    await inyectarSesionVigente(page);
    await mockearBackendAnt(page);
    await page.goto('/app/dashboard');
    await expect(page.locator('#tour-sidebar-icons')).toBeVisible();
  });

  test('los botones de acción del header llegan a 44×44', async ({ page }) => {
    // WCAG 2.5.5 (AAA) y la guía de Apple: 44×44 para un control de acción.
    const acciones = ['Comunicados del sistema', 'Activar modo oscuro', 'Activar modo claro'];
    for (const nombre of acciones) {
      const boton = page.locator('header').getByRole('button', { name: nombre });
      if ((await boton.count()) === 0) continue;
      const caja = (await boton.first().boundingBox())!;
      expect(Math.round(caja.width), `ancho de "${nombre}"`).toBeGreaterThanOrEqual(44);
      expect(Math.round(caja.height), `alto de "${nombre}"`).toBeGreaterThanOrEqual(44);
    }
  });

  test('ningún control del shell baja del mínimo de 24×24 de WCAG 2.5.8', async ({ page }) => {
    // El piso AA para cualquier objetivo, incluidos los enlaces en línea del
    // breadcrumb, a los que estirar a 44 de ancho les arruinaría la ruta.
    const chicos = await objetivosTactilesChicos(page, 24);
    expect(chicos, 'controles por debajo de 24×24').toEqual([]);
  });

  test('los íconos de sistema del rail son cómodos de tocar', async ({ page }) => {
    const iconos = page.locator('#tour-sidebar-icons button.sidebar-icon-btn');
    const total = await iconos.count();
    expect(total).toBeGreaterThan(0);

    for (let i = 0; i < total; i++) {
      const caja = (await iconos.nth(i).boundingBox())!;
      expect(Math.round(caja.width)).toBeGreaterThanOrEqual(44);
      expect(Math.round(caja.height)).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe('Tablets: cruzan el breakpoint y activan el layout de escritorio', () => {
  for (const tablet of DISPOSITIVOS.filter((d) => d.esTablet)) {
    test(`${tablet.nombre} (${tablet.ancho}px) monta el rail lateral y no desborda`, async ({ page }) => {
      await page.setViewportSize({ width: tablet.ancho, height: tablet.alto });
      await inyectarSesionVigente(page);
      await mockearBackendAnt(page);
      await page.goto('/app/dashboard');

      const rail = page.locator('#tour-sidebar-icons');
      await expect(rail).toBeVisible();
      const caja = (await rail.boundingBox())!;
      // Desde `sm` el rail vuelve a ser la columna angosta de la izquierda.
      expect(caja.width).toBeLessThan(120);
      expect(caja.y).toBeLessThan(tablet.alto / 2);

      expect(await paginaDesbordaEnHorizontal(page)).toBe(false);
    });
  }
});
