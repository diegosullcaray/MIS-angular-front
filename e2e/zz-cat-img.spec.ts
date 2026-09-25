import { test, expect } from '@playwright/test';
const S = 'C:/Users/24681/AppData/Local/Temp/claude/c--Users-24681-Videos-DD/c632ad4b-a084-46d4-b340-5d1dcdd25123/scratchpad';
test('preview', async ({ page }, info) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('mis.sesion', JSON.stringify({ token: 'e2e', expiraEn: Date.now() + 9e5, usuario: { id: 'u', nombre: 'Ana Torres', email: 'e2e.playwright@confianza.pe', rol: 'asesor', subsistemas: [], codBt: 'BT-001', tipoUsuario: 1 } }));
    localStorage.setItem('mis.preferencias', JSON.stringify({ anuncios: { vistos: [], silenciar: true }, bienvenida: { vista: true }, apariencia: { tema: 'claro' } }));
  });
  await page.route('**/cores2/ant/**', (r) => {
    const s = r.request().headers()['winder-params'] ?? '';
    const body = s.includes('categorizacion.detalle')
      ? { resultado: { data: { codgru: 2, nom: 'Ana Torres', car: 'Asesor', gen: 'F', cat: 'Oro', uni: 'U1', corr: 'C1', terr: 'T1' }, per: [] } }
      : {};
    return r.fulfill({ json: { code: '0', headers: {}, body } });
  });
  await page.goto('/app/analista/categorizacion'); await page.waitForLoadState('networkidle');
  console.log('botones en p-image:', await page.locator('p-image').first().evaluate((e) => [...e.querySelectorAll('button, [role=button], img')].map((b) => b.tagName + '.' + b.className).join(' | ')));
  await page.locator('p-image').first().hover();
  await page.locator('p-image button').first().click();
  const mascara = page.locator('.p-image-mask').first();
  await expect(mascara).toBeVisible();
  await page.waitForTimeout(600);
  console.log('mascaras:', await page.evaluate(() => [...document.querySelectorAll('.p-image-mask')].map((m) => m.parentElement?.tagName).join(',')));
  const caja = (await mascara.boundingBox())!; const vp = page.viewportSize()!;
  console.log(info.project.name, 'mascara', Math.round(caja.width), 'x', Math.round(caja.height), 'viewport', vp.width, 'x', vp.height,
    'padre:', await mascara.evaluate((e) => e.parentElement?.tagName));
  console.log('ancestros que encierran fixed:', await mascara.evaluate((e) => {
    const out: string[] = []; let n = e.parentElement;
    while (n) { const cs = getComputedStyle(n); if (cs.backdropFilter !== 'none' || cs.transform !== 'none' || cs.filter !== 'none' || cs.contain.includes('paint') || cs.willChange.includes('transform')) out.push(n.tagName + '.' + String(n.className).split(' ').slice(0, 2).join('.') + ` [bf=${cs.backdropFilter} tf=${cs.transform}]`); n = n.parentElement; }
    return out.join('  <  ');
  }));
  await page.screenshot({ path: `${S}/cat-preview-${info.project.name}.png` });
  await page.keyboard.press('Escape');
  await expect(mascara).toBeHidden();
});
