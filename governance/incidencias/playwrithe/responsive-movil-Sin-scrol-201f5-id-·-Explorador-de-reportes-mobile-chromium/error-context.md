# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive-movil.spec.ts >> Sin scroll horizontal en ningún teléfono >> Galaxy A54 (384px, android) · Explorador de reportes
- Location: e2e\responsive-movil.spec.ts:29:11

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#tour-sidebar-icons')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#tour-sidebar-icons')
    - waiting for "http://localhost:4300/app/reportes" navigation to finish...
    - navigated to "http://localhost:4300/app/reportes"

```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - generic [ref=f1e4]:
    - complementary "Sistemas" [ref=f1e6]:
      - button "Inicio" [ref=f1e9] [cursor=pointer]:
        - generic [ref=f1e10]: 
    - generic [ref=f1e12]:
      - banner [ref=f1e13]:
        - generic [ref=f1e15]:
          - navigation [ref=f1e18]:
            - list [ref=f1e19]:
              - listitem [ref=f1e20]:
                - link "" [ref=f1e21] [cursor=pointer]:
                  - /url: /app/dashboard
              - listitem [ref=f1e23]
              - listitem [ref=f1e26]:
                - generic [ref=f1e27]: Reportes
              - listitem [ref=f1e29]
              - listitem [ref=f1e32]:
                - generic [ref=f1e33]: Mon desem
          - generic [ref=f1e35]:
            - button "Activar modo claro" [pressed] [ref=f1e36] [cursor=pointer]
            - button "Comunicados del sistema" [ref=f1e44] [cursor=pointer]
            - button "UE" [ref=f1e50] [cursor=pointer]
      - main [ref=f1e55]:
        - generic [ref=f1e59]:
          - generic [ref=f1e60]:
            - group "Controles de la ventana" [ref=f1e61]:
              - button "Cerrar y volver al inicio" [ref=f1e62] [cursor=pointer]: ✕
              - button "Volver" [ref=f1e63] [cursor=pointer]: ‹
              - button "Ver en pantalla completa" [ref=f1e64] [cursor=pointer]: ⤢
            - heading "Monitor Metas Desembolso" [level=1] [ref=f1e66]
            - button "Mostrar filtros" [ref=f1e68] [cursor=pointer]:
              - generic [ref=f1e69]: 
          - generic [ref=f1e70]:
            - text: 
            - generic [ref=f1e72]:
              - heading "Elige un nivel de la jerarquía" [level=4] [ref=f1e78]
              - paragraph [ref=f1e79]: Selecciona una unidad en los filtros de arriba para ver el reporte.
  - alert [ref=f1e82]:
    - generic [ref=f1e83]:
      - generic [ref=f1e87]:
        - generic [ref=f1e88]: No se pudo cargar la jerarquía
        - generic [ref=f1e89]: Inténtalo de nuevo en unos segundos.
      - button "Close" [active] [ref=f1e91] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { inyectarSesionVigente, mockearBackendAnt } from './fixtures/session';
  3   | import { DISPOSITIVOS, TELEFONOS } from './fixtures/dispositivos';
  4   | import { buscarDesbordes, paginaDesbordaEnHorizontal, objetivosTactilesChicos } from './fixtures/desbordes';
  5   | 
  6   | /**
  7   |  * Responsive en móviles reales (Android e iOS).
  8   |  *
  9   |  * jsdom no calcula layout, así que un test unitario no puede ver un desborde:
  10  |  * esto corre en un navegador de verdad, a los viewports reales de la matriz de
  11  |  * `fixtures/dispositivos.ts`.
  12  |  *
  13  |  * La regla es una sola y dura: **ninguna pantalla puede tener scroll
  14  |  * horizontal**. Una tabla ancha se resuelve con su propio contenedor
  15  |  * desplazable, no empujando la página.
  16  |  */
  17  | 
  18  | /** Las pantallas que un usuario abre primero y que más elementos meten en pantalla. */
  19  | const PANTALLAS = [
  20  |   { nombre: 'Dashboard', ruta: '/app/dashboard' },
  21  |   { nombre: 'Explorador de reportes', ruta: '/app/reportes' },
  22  |   { nombre: 'Actividades', ruta: '/app/actividades' },
  23  |   { nombre: 'Base negativa', ruta: '/app/cons_base_negativa' },
  24  | ] as const;
  25  | 
  26  | test.describe('Sin scroll horizontal en ningún teléfono', () => {
  27  |   for (const dispositivo of TELEFONOS) {
  28  |     for (const pantalla of PANTALLAS) {
  29  |       test(`${dispositivo.nombre} (${dispositivo.ancho}px, ${dispositivo.so}) · ${pantalla.nombre}`, async ({
  30  |         page,
  31  |       }) => {
  32  |         await page.setViewportSize({ width: dispositivo.ancho, height: dispositivo.alto });
  33  |         await inyectarSesionVigente(page);
  34  |         await mockearBackendAnt(page);
  35  | 
  36  |         await page.goto(pantalla.ruta);
> 37  |         await expect(page.locator('#tour-sidebar-icons')).toBeVisible();
      |                                                           ^ Error: expect(locator).toBeVisible() failed
  38  |         // La barra inferior de móvil se monta después del primer render.
  39  |         await page.waitForTimeout(300);
  40  | 
  41  |         // La aserción dura es a nivel de PÁGINA: que no aparezca la barra de
  42  |         // scroll horizontal. Un elemento más ancho que la pantalla dentro de su
  43  |         // contenedor desplazable (una tabla de reporte, por ejemplo) es la
  44  |         // solución esperada, no un defecto. Los elementos se listan solo para
  45  |         // ubicar la causa cuando la página sí desborda.
  46  |         const desborda = await paginaDesbordaEnHorizontal(page);
  47  |         const culpables = desborda ? await buscarDesbordes(page) : [];
  48  |         expect(culpables, `${pantalla.nombre} @ ${dispositivo.ancho}px empuja la página`).toEqual([]);
  49  |         expect(desborda, `scroll horizontal en ${pantalla.nombre} @ ${dispositivo.ancho}px`).toBe(false);
  50  |       });
  51  |     }
  52  |   }
  53  | });
  54  | 
  55  | test.describe('El shell en el ancho más chico del mercado', () => {
  56  |   const fold = TELEFONOS[0];
  57  | 
  58  |   test.beforeEach(async ({ page }) => {
  59  |     await page.setViewportSize({ width: fold.ancho, height: fold.alto });
  60  |     await inyectarSesionVigente(page);
  61  |     await mockearBackendAnt(page);
  62  |   });
  63  | 
  64  |   test('el rail de sistemas es la barra inferior, no la columna lateral', async ({ page }) => {
  65  |     await page.goto('/app/dashboard');
  66  |     const rail = page.locator('#tour-sidebar-icons');
  67  |     await expect(rail).toBeVisible();
  68  | 
  69  |     const caja = (await rail.boundingBox())!;
  70  |     // En móvil el rail va abajo, a todo el ancho: si estuviera de columna, se
  71  |     // comería la mitad de los 280px.
  72  |     expect(caja.width).toBeGreaterThanOrEqual(fold.ancho - 1);
  73  |     expect(caja.y).toBeGreaterThan(fold.alto / 2);
  74  |   });
  75  | 
  76  |   test('el header entra completo, sin comerse el breadcrumb', async ({ page }) => {
  77  |     await page.goto('/app/dashboard');
  78  |     const header = page.locator('header').first();
  79  |     const caja = (await header.boundingBox())!;
  80  | 
  81  |     expect(Math.round(caja.width)).toBeLessThanOrEqual(fold.ancho);
  82  |     expect(caja.x).toBeGreaterThanOrEqual(-1);
  83  |   });
  84  | 
  85  |   test('el contenido no queda tapado por la barra inferior fija', async ({ page }) => {
  86  |     await page.goto('/app/dashboard');
  87  |     await expect(page.locator('#tour-sidebar-icons')).toBeVisible();
  88  | 
  89  |     // El shell reserva espacio abajo (`pb-16`) justamente para que la barra fija
  90  |     // no se coma la última fila. Se compara contra el alto REAL del rail, que es
  91  |     // lo que importa, y no contra un número mágico.
  92  |     const { finDelContenido, inicioDelRail } = await page.evaluate(() => {
  93  |       const main = document.querySelector('main')!;
  94  |       const rail = document.querySelector('#tour-sidebar-icons')!;
  95  |       return {
  96  |         finDelContenido: Math.round(main.getBoundingClientRect().bottom),
  97  |         inicioDelRail: Math.round(rail.getBoundingClientRect().top),
  98  |       };
  99  |     });
  100 |     expect(finDelContenido).toBeLessThanOrEqual(inicioDelRail);
  101 |   });
  102 | });
  103 | 
  104 | test.describe('Diálogos en móvil', () => {
  105 |   const telefono = TELEFONOS[1];
  106 | 
  107 |   test.beforeEach(async ({ page }) => {
  108 |     await page.setViewportSize({ width: telefono.ancho, height: telefono.alto });
  109 |     await inyectarSesionVigente(page);
  110 |     await mockearBackendAnt(page);
  111 |   });
  112 | 
  113 |   test('el diálogo de configuración entra en el ancho del teléfono', async ({ page }) => {
  114 |     await page.goto('/app/dashboard');
  115 |     await page.locator('header [role="button"][aria-haspopup="true"]').click();
  116 |     await page.getByRole('menuitem', { name: 'Configuración' }).click();
  117 | 
  118 |     const dialogo = page.getByRole('dialog').filter({ hasText: 'Configuración' });
  119 |     await expect(dialogo).toBeVisible();
  120 | 
  121 |     const caja = (await dialogo.boundingBox())!;
  122 |     expect(Math.round(caja.width)).toBeLessThanOrEqual(telefono.ancho);
  123 |     expect(caja.x).toBeGreaterThanOrEqual(-1);
  124 |     expect(await paginaDesbordaEnHorizontal(page)).toBe(false);
  125 |   });
  126 | });
  127 | 
  128 | test.describe('Objetivos táctiles', () => {
  129 |   const telefono = TELEFONOS[1];
  130 | 
  131 |   test.beforeEach(async ({ page }) => {
  132 |     await page.setViewportSize({ width: telefono.ancho, height: telefono.alto });
  133 |     await inyectarSesionVigente(page);
  134 |     await mockearBackendAnt(page);
  135 |     await page.goto('/app/dashboard');
  136 |     await expect(page.locator('#tour-sidebar-icons')).toBeVisible();
  137 |   });
```