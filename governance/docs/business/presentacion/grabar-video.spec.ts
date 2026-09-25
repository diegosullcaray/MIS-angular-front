import { test, expect } from '@playwright/test';
import type { Browser, BrowserContext, Page } from '@playwright/test';
import { QUINCE_MINUTOS_MS, SESSION_STORAGE_KEY, USUARIO_DE_PRUEBA, inyectarPreferencias, inyectarSesionVigente } from './fixtures/session';

/* Grabación del video de lanzamiento: una escena por test, cada una en su propio .webm. */
const DIR = process.env['VIDEO_DIR'] ?? '/tmp/video';
const ESCRITORIO = { width: 1600, height: 900 };
const TELEFONO = { width: 390, height: 844 };

test.describe.configure({ mode: 'serial' });
test.setTimeout(120_000);

const RAIZ = { tip_cod: 9, cod_rel: 'FC', lvl: 1 };
const NIVEL_1 = [{ tip_cod: 9, cod_rel: 'FC', des_rel: 'FINANCIERA', lvl: 1, lbl_hier: 'FINANCIERA' }];

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/* ── Leyenda en pantalla, estilo keynote ─────────────────────────────── */
async function leyenda(page: Page, texto: string) {
  await page.evaluate((t) => {
    let el = document.getElementById('video-leyenda');
    if (!el) {
      const estilo = document.createElement('style');
      estilo.textContent = `
        #video-leyenda { position: fixed; left: 50%; bottom: 48px; transform: translateX(-50%); z-index: 99999;
          font: 600 30px/1.25 'Inter', -apple-system, 'Segoe UI', sans-serif; letter-spacing: -0.01em; color: #fff;
          padding: 16px 30px; border-radius: 18px; background: rgba(12, 18, 28, 0.72);
          backdrop-filter: blur(18px) saturate(1.4); -webkit-backdrop-filter: blur(18px) saturate(1.4);
          box-shadow: 0 12px 40px rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.14);
          transition: opacity .45s ease, transform .45s ease; text-align: center; max-width: 80vw; pointer-events: none; }
        #video-leyenda.oculta { opacity: 0; transform: translate(-50%, 10px); }
        @media (max-width: 500px) { #video-leyenda { font-size: 19px; bottom: auto; top: 58px; padding: 12px 18px; border-radius: 14px; max-width: 88vw; } }`;
      document.head.appendChild(estilo);
      el = document.createElement('div');
      el.id = 'video-leyenda';
      el.className = 'oculta';
      document.body.appendChild(el);
    }
    const nodo = el;
    nodo.classList.add('oculta');
    setTimeout(() => {
      nodo.textContent = t;
      nodo.classList.remove('oculta');
    }, t ? 450 : 0);
  }, texto);
}

async function cursorVisible(page: Page) {
  await page.addInitScript(() => {
    window.addEventListener('DOMContentLoaded', () => {
      const c = document.createElement('div');
      c.id = 'video-cursor';
      c.style.cssText = 'position:fixed;z-index:100000;width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.9);' +
        'border:2px solid rgba(20,30,45,.6);box-shadow:0 2px 8px rgba(0,0,0,.35);pointer-events:none;left:-40px;top:-40px;' +
        'transform:translate(-50%,-50%);transition:transform .15s ease;';
      document.body.appendChild(c);
      document.addEventListener('mousemove', (e) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; });
      document.addEventListener('mousedown', () => (c.style.transform = 'translate(-50%,-50%) scale(.7)'));
      document.addEventListener('mouseup', () => (c.style.transform = 'translate(-50%,-50%) scale(1)'));
    });
  });
}

/** Mueve el cursor suavemente hasta el elemento y hace clic. */
async function clicSuave(page: Page, selector: ReturnType<Page['locator']>) {
  const b = (await selector.boundingBox())!;
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 28 });
  await esperar(250);
  await page.mouse.down();
  await esperar(90);
  await page.mouse.up();
}

async function contexto(browser: Browser, nombre: string, viewport: { width: number; height: number }, tema: 'light' | 'dark' = 'light'): Promise<{ ctx: BrowserContext; page: Page }> {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    colorScheme: tema,
    recordVideo: { dir: `${DIR}/${nombre}`, size: viewport },
  });
  const page = await ctx.newPage();
  return { ctx, page };
}

/* ── Tarjetas de título ──────────────────────────────────────────────── */
async function tarjeta(browser: Browser, nombre: string, html: string, duracionMs: number) {
  const { ctx, page } = await contexto(browser, nombre, ESCRITORIO, 'dark');
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800&display=swap" rel="stylesheet">
    <style>
      html,body{margin:0;height:100%;background:#07090d;color:#f2f4f7;font-family:'Inter',-apple-system,'Segoe UI',sans-serif;overflow:hidden}
      .centro{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:28px;text-align:center;padding:0 120px}
      .l{opacity:0;transform:translateY(14px);animation:entra .9s cubic-bezier(.2,.7,.2,1) forwards}
      @keyframes entra{to{opacity:1;transform:none}}
      h1{font-size:84px;font-weight:800;letter-spacing:-.035em;line-height:1.02;margin:0}
      h2{font-size:48px;font-weight:700;letter-spacing:-.025em;line-height:1.1;margin:0}
      p{font-size:30px;font-weight:500;color:#a9b3c2;margin:0;letter-spacing:-.01em}
      .ambar{color:#d9a45c}
      .brillo{background:linear-gradient(90deg,#e8eef9,#7cc4ff 55%,#e8eef9);-webkit-background-clip:text;background-clip:text;color:transparent}
      .ventana{width:760px;height:420px;border-radius:22px;background:linear-gradient(160deg,rgba(255,255,255,.14),rgba(255,255,255,.04));
        border:1px solid rgba(255,255,255,.18);box-shadow:0 40px 120px rgba(0,120,255,.18),inset 0 1px 0 rgba(255,255,255,.2);
        backdrop-filter:blur(20px);position:relative;opacity:0;transform:scale(.86);animation:abre 1.3s cubic-bezier(.2,.8,.2,1) .2s forwards;
        display:flex;align-items:center;justify-content:center}
      .ventana .barra{position:absolute;top:18px;left:22px;display:flex;gap:10px}
      .ventana .barra i{width:14px;height:14px;border-radius:50%;display:block}
      @keyframes abre{to{opacity:1;transform:none}}
      .glow{position:absolute;inset:0;background:radial-gradient(800px 420px at 50% 60%,rgba(0,148,234,.18),transparent 70%);opacity:0;animation:entra 2s ease .4s forwards}
    </style></head><body><div class="glow"></div><div class="centro">${html}</div></body></html>`);
  await page.waitForTimeout(duracionMs);
  await ctx.close();
}

test('01 prólogo', async ({ browser }) => {
  await tarjeta(browser, '01-prologo', `
    <h2 class="l ambar" style="animation-delay:.3s">Todos los días hacemos la misma pregunta.</h2>
    <h1 class="l" style="animation-delay:1.6s">¿Cómo va mi cartera hoy?</h1>`, 5200);
});

test('02 antes', async ({ browser }) => {
  await tarjeta(browser, '02-antes', `
    <p class="l" style="animation-delay:.2s">La respuesta estaba ahí. Pero costaba llegar a ella.</p>
    <h2 class="l ambar" style="animation-delay:1.4s">Pantallas llenas.</h2>
    <h2 class="l ambar" style="animation-delay:2.2s">Esperas sin saber qué pasaba.</h2>
    <h2 class="l ambar" style="animation-delay:3.0s">Tablas que no cabían en la pantalla.</h2>`, 6200);
});

test('03 revelación', async ({ browser }) => {
  await tarjeta(browser, '03-revelacion', `
    <div class="ventana"><div class="barra"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div>
      <h1 class="l brillo" style="animation-delay:1.3s;font-size:96px">El nuevo MIS</h1></div>
    <p class="l" style="animation-delay:2.3s">Todo lo que necesitas. Nada que estorbe.</p>`, 5600);
});

/* ── Escena: Saldo Cartera, cargando por partes ──────────────────────── */
const ZONAS = ['Lima Norte', 'Lima Sur', 'Centro', 'Sur Andino', 'Norte', 'Oriente', 'Costa Sur', 'Sierra Central'];
function tablaSaldo(titulo: string, semilla: number) {
  const headers = [{ columns: [
    { columnDef: 'des', header: titulo, isdata: 1 },
    { columnDef: 'sal', header: 'Saldo (S/)', isdata: 2 },
    { columnDef: 'var', header: 'Var. mes', isdata: 3 },
    { columnDef: 'cli', header: 'Clientes', isdata: 4 },
    { columnDef: 'mor', header: '% Mora', isdata: 5 },
  ] }];
  const BASE = [18_742_310, 15_208_944, 21_655_017, 9_873_402, 16_390_228, 7_415_689, 11_902_535, 13_218_090];
  const body = ZONAS.map((z, i) => {
    const sal = Math.round(BASE[i] * (1 + ((semilla * 13 + i * 7) % 11 - 5) / 100));
    return {
      des: z,
      sal: sal.toLocaleString('en-US'),
      var: `${(((i * 37 + semilla * 11) % 90) / 10 - 2).toFixed(1)}%`,
      cli: (3200 + ((i * 613 + semilla * 97) % 2800)).toLocaleString('en-US'),
      mor: `${(3 + ((i * 17 + semilla) % 40) / 10).toFixed(1)}%`,
    };
  });
  body.push({ des: 'Total', sal: '128,406,215', var: '1.8%', cli: '34,512', mor: '4.6%' });
  return { headers, body, additional: {} };
}

async function sesion(page: Page, extra: Record<string, unknown> = {}, tema: 'claro' | 'oscuro' = 'claro') {
  await inyectarSesionVigente(page);
  await inyectarPreferencias(page, {
    anuncios: { vistos: [], silenciar: true }, bienvenida: { vista: true },
    apariencia: { tema, fondo: 'institucional', colorFondo: '#1d396e', acento: '#0094ea' },
  });
  if (Object.keys(extra).length) {
    await page.addInitScript(({ key, usuario, expiraEn }) => {
      window.sessionStorage.setItem(key, JSON.stringify({ token: 'x', usuario, expiraEn }));
    }, { key: SESSION_STORAGE_KEY, usuario: { ...USUARIO_DE_PRUEBA, nombre: 'María Torres', ...extra }, expiraEn: Date.now() + QUINCE_MINUTOS_MS });
  } else {
    await page.addInitScript(({ key, usuario, expiraEn }) => {
      window.sessionStorage.setItem(key, JSON.stringify({ token: 'x', usuario, expiraEn }));
    }, { key: SESSION_STORAGE_KEY, usuario: { ...USUARIO_DE_PRUEBA, nombre: 'María Torres' }, expiraEn: Date.now() + QUINCE_MINUTOS_MS });
  }
  await cursorVisible(page);
}

test('04 inicio y saldo cartera', async ({ browser }) => {
  const { ctx, page } = await contexto(browser, '04-saldo', ESCRITORIO);
  let bloque = 0;
  const titulos = ['Zona', 'Zona', 'Zona', 'Zona', 'Zona', 'Zona'];
  await page.route('**/cores2/ant/**', async (route) => {
    const s = route.request().headers()['winder-params'] ?? '';
    let body: unknown = {};
    let espera = 0;
    if (s.includes('base_hier')) body = { base_hierarchy: [RAIZ] };
    else if (s.includes('level_hier')) body = { level_hierarchy: NIVEL_1 };
    else if (s.includes('regularData')) {
      const i = bloque++;
      espera = 900 + i * 900;
      body = { result: tablaSaldo(titulos[i % titulos.length], i + 1) };
    }
    if (espera) await esperar(espera);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) }).catch(() => undefined);
  });
  await sesion(page);
  await page.goto('/app');
  await page.waitForLoadState('networkidle');
  await leyenda(page, 'Una sola ventana para todo tu trabajo.');
  await page.mouse.move(800, 450);
  await esperar(3200);

  await leyenda(page, 'Eliges un reporte…');
  await page.goto('/app/reportes/leg/com/rda/adm/saldo');
  await leyenda(page, 'y la información aparece apenas está lista.');
  await esperar(7000);
  await page.mouse.move(700, 500, { steps: 30 });
  await page.mouse.wheel(0, 380);
  await esperar(2200);
  await ctx.close();
});

/* ── Escena: Agro Mix, un clic y el detalle en gráficos ──────────────── */
test('05 detalle con un clic', async ({ browser }) => {
  const { ctx, page } = await contexto(browser, '05-detalle', ESCRITORIO);
  const grafico = (cats: string[], vals: number[]) => JSON.stringify({ categories: cats, series: [{ name: 'Saldo', data: vals }] });
  const CULTIVOS = ['Café', 'Cacao', 'Arroz', 'Papa', 'Maíz', 'Palta'];
  await page.route('**/cores2/ant/**', async (route) => {
    const s = route.request().headers()['winder-params'] ?? '';
    let body: unknown = {};
    let espera = 0;
    if (s.includes('base_hier')) body = { base_hierarchy: [RAIZ] };
    else if (s.includes('level_hier')) body = { level_hierarchy: NIVEL_1 };
    else if (s.includes('RS_FECH')) body = {};
    else if (s.includes('RS_AGROMIX_01')) {
      body = { resultado: {
        headers: JSON.stringify([
          { key: 'rdesjer', label: 'Zona' },
          { key: 'HSALCAPMN', label: 'Saldo (S/)', format: { type: 'integer' } },
          { key: 'HSALVEMN', label: 'Saldo vencido (S/)', format: { type: 'integer' } },
          { key: 'HCCLI', label: 'Clientes', format: { type: 'integer' } },
          { key: 'EXTE', label: 'Hectáreas', format: { type: 'integer' } },
        ]),
        data: ZONAS.slice(0, 6).map((z, i) => ({ rdesjer: z.toUpperCase(), htipcod: 13, cod_rel: `Z${i}`,
          HSALCAPMN: 4_200_000 + i * 713_000, HSALVEMN: 150_000 + i * 21_000, HCCLI: 820 + i * 97, EXTE: 1_300 + i * 211 })),
        meta1: [{ HSALCAPMN: 4_010_000, HSALVEMN: 162_000, HCCLI: 791, EXTE: 1_262 }],
      } };
    } else if (s.includes('RS_AGROMIX_')) {
      espera = 2600;
      body = { resultado: { headers: grafico(CULTIVOS, [18_200_000, 14_300_000, 9_800_000, 7_600_000, 5_400_000, 3_300_000]), data: [] } };
    }
    if (espera) await esperar(espera);
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) }).catch(() => undefined);
  });
  await sesion(page);
  await page.goto('/app/reportes/repositorio/actividad-diaria/cartera/agro-mix');
  await page.waitForLoadState('networkidle');
  await leyenda(page, '¿Quieres ver más? Un clic.');
  await esperar(2200);
  const fila = page.locator('app-tabla-dinamica tr').filter({ hasText: 'CENTRO' });
  await clicSuave(page, fila.locator('td.underline').nth(1));
  await leyenda(page, 'Y el detalle aparece en gráficos, listo para leer.');
  await esperar(6500);
  await ctx.close();
});

/* ── Escena: modo oscuro ─────────────────────────────────────────────── */
test('06 modo oscuro', async ({ browser }) => {
  const { ctx, page } = await contexto(browser, '06-oscuro', ESCRITORIO);
  let bloque = 0;
  await page.route('**/cores2/ant/**', async (route) => {
    const s = route.request().headers()['winder-params'] ?? '';
    let body: unknown = {};
    if (s.includes('base_hier')) body = { base_hierarchy: [RAIZ] };
    else if (s.includes('level_hier')) body = { level_hierarchy: NIVEL_1 };
    else if (s.includes('regularData')) body = { result: tablaSaldo('Zona', ++bloque) };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) }).catch(() => undefined);
  });
  await sesion(page);
  await page.goto('/app/reportes/leg/com/rda/adm/saldo');
  await page.waitForLoadState('networkidle');
  await esperar(800);
  await leyenda(page, 'De día o de noche, como prefieras.');
  await esperar(1400);
  await clicSuave(page, page.getByRole('button', { name: 'Activar modo oscuro' }));
  await esperar(4200);
  await ctx.close();
});

/* ── Escena: incentivos en el teléfono ───────────────────────────────── */
test('07 telefono incentivos', async ({ browser }) => {
  const { ctx, page } = await contexto(browser, '07-telefono', TELEFONO, 'dark');
  const RESULTADOS = {
    ds1: [
      { cod_var: 1, ini_n: 2_410_500, cie_n: 2_531_020, cie_n_o: 40_200, cie_n_d: 12_800, var_real: 120_520, met: 2_400_000, mon: 850, avan_fix: 1.05 },
      { cod_var: 2, ini_n: 412, cie_n: 431, cie_n_o: 6, cie_n_d: 3, var_real: 19, met: 525, mon: 320, avan_fix: 0.82 },
    ],
    ds2: [
      { cod_var: 3, ini: 58, man_efe: 21, rec: 7, efec: 0.48, met: 0.6, mon: 0, avan_fix: 0.48 },
      { cod_var: 4, ini: 44, man_efe: 30, rec: 11, efec: 0.93, met: 0.85, mon: 110, avan_fix: 1.09 },
    ],
    ds3: { car_avan_fix: 1.05, car_avan_floor: 100, cli_avan_fix: 0.82, cli_avan_floor: 82, efec1_avan_fix: 0.48, efec1_avan_floor: 48,
      efec2_avan_fix: 0.93, efec2_avan_floor: 93, efec3_avan_fix: 0.71, efec3_avan_floor: 71 },
    ds4: { flag_car: 1, flag_cli: 1, flag_efec1: 0, flag_efec2: 1, flag_efec3: 2, flag_act: 1,
      bob_car: 850, bop_car: 320, bos_prod: 150, bos_clib: 90, bos_ret: 60, bos_tas: 40 },
  };
  await page.route('**/cores2/ant/**', (route) => {
    const s = route.request().headers()['winder-params'] ?? '';
    const body = s.includes('resultados') ? { resultado: RESULTADOS } : {};
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body }) });
  });
  await sesion(page, { nivelIncentivos: 'CARGO', claUse: 1, fechaCorte: '20260924', cargo: 'Asesora de Negocios' }, 'oscuro');
  await page.goto('/app/incentivos3');
  await expect(page.locator('.semaforo-chip').first()).toBeVisible();
  await leyenda(page, 'Y en tu teléfono, tus metas al día.');
  await esperar(3500);
  const panel = page.locator('app-avances-grid');
  await panel.scrollIntoViewIfNeeded();
  await esperar(3500);
  await page.locator('app-super-plus-grid').scrollIntoViewIfNeeded();
  await esperar(3000);
  await ctx.close();
});

test('08 cierre', async ({ browser }) => {
  await tarjeta(browser, '08-cierre', `
    <div class="ventana" style="width:900px;height:360px"><div class="barra"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div>
      <h1 class="l brillo" style="animation-delay:1.2s">Todo el MIS.<br>Una sola ventana.</h1></div>
    <p class="l" style="animation-delay:2.6s">Muy pronto en todas las agencias.</p>`, 6500);
});
