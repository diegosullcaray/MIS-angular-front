# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: actividad-diaria-lote-03.spec.ts >> Actividad Diaria — smoke del lote 03 >> Tablero Digital - Corresponsales resuelve en /app/reportes/leg/com/rda/adm/tab-digital
- Location: e2e\actividad-diaria-lote-03.spec.ts:32:9

# Error details

```
Error: page.goto: net::ERR_ABORTED at http://localhost:4300/app/reportes/leg/com/rda/adm/tab-digital
Call log:
  - navigating to "http://localhost:4300/app/reportes/leg/com/rda/adm/tab-digital", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { inyectarSesionVigente } from './fixtures/session';
  3  | 
  4  | /**
  5  |  * Smoke del lote 03: "Aplicativo Móvil", "Tablero Digital" (con sus sub-nodos
  6  |  * Operaciones y Corresponsal) y los dos "Resumen de Movilidad", que no cuelgan
  7  |  * de ningún sub-nodo y viven como items directos de "Actividad Diaria".
  8  |  *
  9  |  * El título esperado es el `data.title` de `rda-administracion-routing.module.ts`,
  10 |  * que es lo que el legado pinta en la barra de la ventana.
  11 |  */
  12 | const REPORTES: readonly [string, string][] = [
  13 |   // Aplicativo Móvil
  14 |   ['/app/reportes/leg/com/rda/adm/app_uso', 'Uso del App'],
  15 |   // Tablero Digital
  16 |   ['/app/reportes/leg/com/rda/adm/tab-digital', 'Tablero Digital - Corresponsales'],
  17 |   ['/app/reportes/repositorio/actividad-diaria/tab-digital/usa-come', 'Tablero Digital Comercial'],
  18 |   // Tablero Digital → Operaciones
  19 |   ['/app/reportes/leg/com/rda/adm/GC-tab-digital_vr2-ope', 'Gestión Canal Tablero Digital'],
  20 |   ['/app/reportes/leg/com/rda/adm/tab-digital_vr2-ope', 'Tablero Digital'],
  21 |   // Tablero Digital → Corresponsal
  22 |   ['/app/reportes/leg/com/rda/adm/v-general-cor', 'Vista General - Corresponsales'],
  23 |   ['/app/reportes/leg/com/rda/adm/v-gestion-cor', 'Vista Gestión - Corresponsales'],
  24 |   ['/app/reportes/leg/com/rda/adm/det_correspon', 'Detalle Corresponsal'],
  25 |   // Resumen de Movilidad (items directos)
  26 |   ['/app/reportes/leg/com/rda/adm/res-mov', 'Resumen de Movilidad Comercial'],
  27 |   ['/app/reportes/leg/com/rda/adm/res-mov-rec', 'Resumen de Movilidad Recuperaciones'],
  28 | ];
  29 | 
  30 | test.describe('Actividad Diaria — smoke del lote 03', () => {
  31 |   for (const [ruta, titulo] of REPORTES) {
  32 |     test(`${titulo} resuelve en ${ruta}`, async ({ page }) => {
  33 |       await inyectarSesionVigente(page);
> 34 |       await page.goto(ruta);
     |                  ^ Error: page.goto: net::ERR_ABORTED at http://localhost:4300/app/reportes/leg/com/rda/adm/tab-digital
  35 |       await page.waitForLoadState('networkidle');
  36 | 
  37 |       await expect(page.getByRole('heading', { name: titulo, exact: true })).toBeVisible();
  38 |       // Sin esto un typo en el `path` cae en el `**` del módulo y redirige al
  39 |       // primer reporte, con lo que el título de arriba igual podría aparecer.
  40 |       expect(page.url()).toContain(ruta);
  41 |     });
  42 |   }
  43 | });
  44 | 
```