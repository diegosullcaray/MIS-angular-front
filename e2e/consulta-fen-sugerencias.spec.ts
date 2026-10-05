import { test, expect } from '@playwright/test';
import { inyectarSesionVigente } from './fixtures/session';
test('las sugerencias del buscador quedan por delante de la matriz de riesgos', async ({ page }) => {
  await inyectarSesionVigente(page);
  await page.route('**/cores2/ant/**', (r) => {
    const fila = (n: string) => ({ cod_ubi: '010101', des_dep: n, des_prov: n, des_dist: n, exp_mas: 'Alto', exp_inu: 'Bajo', exp_seq: 'Medio', exp_pre: 'Alto' });
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ code: '0', headers: {}, body: { resultado: { headers: '[]', data: ['Lima','Limatambo','Limbani','Limabamba','Limones'].map(fila) } } }) });
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/app/consulta-fen');
  await page.fill('#fen-consulta', 'Lim');
  const lb = page.getByRole('listbox');
  await expect(lb).toBeVisible({ timeout: 8000 });
  const r = await lb.evaluate((el) => {
    const b = el.getBoundingClientRect();
    return [0.1, 0.5, 0.9].map((f) => { const t = document.elementFromPoint(b.left + b.width * f, b.top + b.height * f); return el.contains(t) || t === el; });
  });
  expect(r.every(Boolean)).toBe(true);
});
