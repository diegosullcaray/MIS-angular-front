import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { inyectarSesionVigente } from './fixtures/session';
import { mockearReportesConDatos } from './fixtures/reportes-con-datos';
import { buscarDesbordes, paginaDesbordaEnHorizontal, contenedoresScrollBloqueados } from './fixtures/desbordes';
import { ShellPage } from './pages/shell.page';

/**
 * Todos los reportes en teléfonos reales, con una tabla ancha de verdad.
 *
 * Norma (`responsive-movil.spec.ts`, `docs/evidence/performance/responsive-color.md`,
 * skill `mis-component-styling` § 4):
 * ninguna pantalla puede tener scroll horizontal, y una tabla ancha se resuelve
 * con su propio contenedor desplazable. Acá se suma lo que en móvil rompe una
 * tabla sin que la página se entere:
 *
 * 1. **Columnas ocultas**: en teléfono se ven las mismas que en escritorio.
 * 2. **Encabezados recortados**: ningún título de columna queda con puntos
 *    suspensivos ni aplastado.
 * 3. **Celdas de datos recortadas**: un valor que se corta con ellipsis o
 *    por un `overflow: hidden` no cumple el contrato de "reducir sin cortar".
 * 4. **Tabla cortada**: si la tabla es más ancha que su contenedor, ese
 *    contenedor tiene que desplazarse (`overflow-x: auto|scroll`), no recortar.
 * 5. **Scroll bloqueado**: un contenedor scrollable dentro de un padre con
 *    `overflow: hidden` anula el scroll y el usuario pierde columnas.
 *
 * La lista de reportes se deriva de los `*.routes.ts` del módulo: un reporte
 * nuevo entra solo en esta prueba.
 */

/** Las rutas de pantalla de `reportes`: todo `path:` con segmentos, sin comodines ni parámetros. */
function rutasDeReportes(): string[] {
  const raiz = resolve(process.cwd(), 'src/app/pages/modules/reportes');
  const archivos: string[] = [];
  const recorrer = (dir: string) => {
    for (const nombre of readdirSync(dir)) {
      const completo = join(dir, nombre);
      if (statSync(completo).isDirectory()) recorrer(completo);
      else if (nombre.endsWith('.routes.ts')) archivos.push(completo);
    }
  };
  recorrer(raiz);

  const rutas = new Set<string>();
  for (const archivo of archivos) {
    const fuente = readFileSync(archivo, 'utf8');
    // Solo destinos reales: se descartan los alias que solo redirigen.
    for (const bloque of fuente.split(/\n\s*\{/)) {
      const path = /path:\s*'([^']+)'/.exec(bloque)?.[1];
      if (!path || !path.includes('/') || path.includes(':') || /redirectTo:/.test(bloque)) continue;
      if (/loadComponent:/.test(bloque)) rutas.add(`/app/reportes/${path}`);
    }
  }
  return [...rutas].sort();
}

interface ProblemaTabla {
  tabla: string;
  problema: string;
}

/** Revisa cada tabla visible: columnas ocultas, encabezados recortados, celdas recortadas y tablas cortadas. */
async function problemasDeTablas(page: Page): Promise<ProblemaTabla[]> {
  return page.evaluate(() => {
    const salida: { tabla: string; problema: string }[] = [];
    const nombre = (t: HTMLElement, i: number) =>
      `${i + 1}ª tabla (${(t.querySelector('th')?.textContent ?? '').trim().slice(0, 24) || 'sin encabezado'})`;

    const tablas = Array.from(document.querySelectorAll<HTMLTableElement>('main table, .mis-window table, table'))
      .filter((t, i, todas) => todas.indexOf(t) === i)
      .filter((t) => {
        const e = getComputedStyle(t);
        return e.display !== 'none' && e.visibility !== 'hidden' && t.getBoundingClientRect().width > 0;
      });

    tablas.forEach((tabla, i) => {
      const id = nombre(tabla, i);

      // 1. Columnas ocultas en móvil (p. ej. `mobileVisible: false`).
      const ocultas = Array.from(tabla.querySelectorAll<HTMLElement>('thead th')).filter(
        (th) => getComputedStyle(th).display === 'none' && (th.textContent ?? '').trim() !== '',
      );
      if (ocultas.length) {
        salida.push({ tabla: id, problema: `columnas ocultas: ${ocultas.map((th) => th.textContent!.trim()).join(', ')}` });
      }

      // 2. Encabezados recortados o aplastados. En celdas de tabla `scrollWidth`
      //    no refleja el texto oculto (la autoprueba de abajo lo demuestra), así
      //    que se mide el texto con un `Range` —da el ancho completo aunque esté
      //    recortado— contra el ancho interior de la celda.
      for (const th of Array.from(tabla.querySelectorAll<HTMLElement>('thead th'))) {
        const texto = (th.textContent ?? '').trim();
        const estilo = getComputedStyle(th);
        if (!texto || estilo.display === 'none') continue;
        const rango = document.createRange();
        rango.selectNodeContents(th);
        const anchoTexto = rango.getBoundingClientRect().width;
        const interior = th.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight);
        const cortado = estilo.overflow !== 'visible' && anchoTexto > interior + 1;
        const aplastado = th.getBoundingClientRect().width < 24;
        if (cortado || aplastado) {
          salida.push({ tabla: id, problema: `encabezado ${cortado ? 'recortado' : 'aplastado'}: "${texto.slice(0, 30)}"` });
        }
      }

      // 3. Celdas de datos recortadas: un td con overflow distinto de visible
      //    cuyo contenido no entra. Umbral de 4px para evitar falsos positivos
      //    por padding o bordes sub-pixel.
      for (const td of Array.from(tabla.querySelectorAll<HTMLElement>('tbody td'))) {
        const texto = (td.textContent ?? '').trim();
        if (!texto || getComputedStyle(td).display === 'none') continue;
        const estiloOverflow = getComputedStyle(td).overflow;
        const recortado = td.scrollWidth > td.clientWidth + 4 && estiloOverflow !== 'visible';
        if (recortado) {
          salida.push({ tabla: id, problema: `celda recortada (overflow: ${estiloOverflow}): "${texto.slice(0, 30)}"` });
          // Solo reportar la primera celda recortada por tabla para no saturar.
          break;
        }
      }

      // 4. Tabla más ancha que su contenedor sin poder desplazarse.
      let padre = tabla.parentElement;
      while (padre && padre !== document.body) {
        const ox = getComputedStyle(padre).overflowX;
        if (ox !== 'visible') {
          if ((ox === 'hidden' || ox === 'clip') && tabla.getBoundingClientRect().width > padre.clientWidth + 1) {
            salida.push({ tabla: id, problema: `cortada por un contenedor con overflow-x: ${ox}` });
          }
          break;
        }
        padre = padre.parentElement;
      }
    });

    return salida;
  });
}

const RUTAS = rutasDeReportes();

/**
 * Los reportes de analista (`rda/sec`) no consultan hasta elegir un asesor: se
 * elige el que devuelve el mock, así su tabla también se revisa. El selector
 * vive en la franja de filtros de la ventana, que arranca plegada.
 */
async function elegirAsesorSiLoPide(page: Page): Promise<void> {
  if ((await page.getByText(/^Elegí un asesor/).count()) === 0) return;
  const mostrarFiltros = page.getByRole('button', { name: 'Mostrar filtros' });
  if (await mostrarFiltros.count()) await mostrarFiltros.first().click();
  await page.getByRole('combobox', { name: 'Asesor' }).first().click();
  await page.getByRole('option', { name: 'ASESOR DE PRUEBA' }).click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

/**
 * Las revisiones tienen que poder fallar: una tabla rota a propósito debe
 * producir cada problema. Sin esto, "todo en verde" podría ser una revisión
 * vacía — así se descubrió que medir `scrollWidth` en un `th` no detectaba nada.
 */
test('las revisiones detectan columnas ocultas, recortes, tablas cortadas y scroll bloqueado', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.setContent(`
    <div style="width: 340px; overflow-x: auto">
      <table style="width: 260px; table-layout: fixed">
        <thead><tr>
          <th style="width: 60px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis">Encabezado demasiado largo</th>
          <th style="display: none">Territorio</th>
          <th style="width: 200px">Saldo</th>
        </tr></thead>
        <tbody><tr>
          <td style="overflow: hidden; white-space: nowrap; text-overflow: ellipsis">Un valor largo que no entra en la celda</td>
          <td style="display: none">b</td><td>c</td>
        </tr></tbody>
      </table>
    </div>
    <div style="width: 300px; overflow-x: hidden">
      <table style="width: 900px"><thead><tr><th>Cortada</th></tr></thead><tbody><tr><td>x</td></tr></tbody></table>
    </div>
    <div style="width: 200px; overflow-x: hidden">
      <div style="width: 600px; overflow-x: auto"><div style="width: 1200px">contenido ancho</div></div>
    </div>`);

  const problemas = (await problemasDeTablas(page)).map((p) => p.problema);
  expect(problemas).toContain('columnas ocultas: Territorio');
  expect(problemas.some((p) => p.startsWith('encabezado recortado'))).toBe(true);
  expect(problemas.some((p) => p.startsWith('celda recortada'))).toBe(true);
  expect(problemas).toContain('cortada por un contenedor con overflow-x: hidden');
  expect((await contenedoresScrollBloqueados(page)).length).toBeGreaterThan(0);
});

/** Viewports de teléfono que prueban los dos extremos del mercado. */
const VIEWPORTS = [
  { nombre: 'Galaxy S8 / gama baja', ancho: 360, alto: 740 },
  { nombre: 'Galaxy Z Fold (plegado)', ancho: 280, alto: 653 },
] as const;

for (const viewport of VIEWPORTS) {
  test.describe(`Reportes en teléfono (${viewport.ancho}px — ${viewport.nombre}): tablas completas y sin scroll de página`, () => {
    test.use({ viewport: { width: viewport.ancho, height: viewport.alto } });

    test('se encontraron las rutas de reportes', () => {
      expect(RUTAS.length).toBeGreaterThan(50);
    });

    for (const ruta of RUTAS) {
      test(ruta.replace('/app/reportes/', ''), async ({ page }) => {
        await inyectarSesionVigente(page);
        await mockearReportesConDatos(page);

        await page.goto(ruta);
        await page.waitForLoadState('networkidle');
        await new ShellPage(page).cerrarPanelSiEstaTapandoElHeader();
        await page.waitForTimeout(700);
        await elegirAsesorSiLoPide(page);

        // El comodín `**` abre el explorador: si pasa, la ruta ya no existe.
        expect(page.url(), 'la ruta abre su pantalla').toContain(ruta);

        // ── Sin scroll horizontal de página ──────────────────────────────
        const desborda = await paginaDesbordaEnHorizontal(page);
        const culpables = desborda ? await buscarDesbordes(page) : [];
        expect(culpables, 'elementos que empujan la página').toEqual([]);
        expect(desborda, 'scroll horizontal de página').toBe(false);

        // ── Tablas completas: sin columnas ocultas, sin recortes ─────────
        expect(await problemasDeTablas(page), 'tablas rotas en móvil').toEqual([]);

        // ── Contenedores scrollables no bloqueados ───────────────────────
        const bloqueados = await contenedoresScrollBloqueados(page);
        expect(bloqueados, 'contenedores con scroll bloqueado por un padre').toEqual([]);
      });
    }
  });
}
