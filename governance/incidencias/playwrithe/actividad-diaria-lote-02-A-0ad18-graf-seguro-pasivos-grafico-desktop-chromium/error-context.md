# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: actividad-diaria-lote-02.spec.ts >> Actividad Diaria — smoke del lote 02 >> Evolutivo Pasivos resuelve en /app/reportes/repositorio/actividad-diaria/seg-pasivos-graf/seguro-pasivos-grafico
- Location: e2e\actividad-diaria-lote-02.spec.ts:35:9

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
=========================== logs ===========================
  "commit" event fired
  "domcontentloaded" event fired
  "load" event fired
============================================================
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { inyectarSesionVigente } from './fixtures/session';
  3  | 
  4  | /**
  5  |  * Smoke de los cinco módulos migrados en el lote 02: Seguros, Campañas,
  6  |  * Comercial Ejecutivo, Proyecciones y Reportes PDM.
  7  |  */
  8  | const REPORTES: readonly [string, string][] = [
  9  |   // Seguros
  10 |   ['/app/reportes/leg/com/rda/adm/cam-seguros', 'Reporte Seguros'],
  11 |   ['/app/reportes/repositorio/actividad-diaria/seguros-pasivos/seguros-pasivos', 'Seguros Pasivos'],
  12 |   ['/app/reportes/repositorio/actividad-diaria/seg-pasivos-graf/seguro-pasivos-grafico', 'Evolutivo Pasivos'],
  13 |   ['/app/reportes/repositorio/actividad-diaria/seguro/seguro-com', 'Reporte Seguros Optativos'],
  14 |   // Campañas
  15 |   ['/app/reportes/leg/com/rda/adm/cam-apa', 'Apadrinamiento'],
  16 |   ['/app/reportes/leg/com/rda/adm/RMentoring', 'Reporte Mentoring'],
  17 |   ['/app/reportes/repositorio/actividad-diaria/campanias/agendamiento', 'Agendamiento'],
  18 |   // Comercial Ejecutivo
  19 |   ['/app/reportes/leg/com/rda/adm/desem-reacfae', 'Desembolsos'],
  20 |   ['/app/reportes/leg/com/rda/adm/cli', 'Clientes'],
  21 |   ['/app/reportes/leg/com/rda/adm/agro', 'Agro'],
  22 |   ['/app/reportes/leg/com/rda/adm/pdm', 'PDM'],
  23 |   // Proyecciones
  24 |   ['/app/reportes/leg/com/rda/adm/proy_M1', 'Proyección colocación'],
  25 |   ['/app/reportes/leg/com/rda/adm/proy_M2', 'Proyección diaria colocación'],
  26 |   // Reportes PDM
  27 |   ['/app/reportes/leg/com/rda/adm/seg_pdm', 'Seguimiento PDM'],
  28 |   ['/app/reportes/repositorio/actividad-diaria/cartera/banca-solidaria', 'Gestión de Banca Solidaria'],
  29 |   // Los dos "Resumen de Movilidad" dejaron de ser un módulo propio: ahora son
  30 |   // items directos de "Actividad Diaria" y su smoke vive en el lote 03.
  31 | ];
  32 | 
  33 | test.describe('Actividad Diaria — smoke del lote 02', () => {
  34 |   for (const [ruta, titulo] of REPORTES) {
  35 |     test(`${titulo} resuelve en ${ruta}`, async ({ page }) => {
  36 |       await inyectarSesionVigente(page);
  37 |       await page.goto(ruta);
> 38 |       await page.waitForLoadState('networkidle');
     |                  ^ Error: page.waitForLoadState: Test timeout of 30000ms exceeded.
  39 | 
  40 |       await expect(page.getByRole('heading', { name: titulo, exact: true })).toBeVisible();
  41 |       // Sin esto un typo en el `path` cae en el `**` del módulo y redirige al
  42 |       // primer reporte, con lo que el título de arriba igual podría aparecer.
  43 |       expect(page.url()).toContain(ruta);
  44 |     });
  45 |   }
  46 | });
  47 | 
```