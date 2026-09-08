---
name: mis-testing-guide
description: Metodología de pruebas de MIS Host con Vitest y Playwright. Usar al escribir specs de mapeos, servicios con transporte Winder, componentes con señales y flujos E2E. Documenta las convenciones reales del repo (globales de Vitest, TestBed para servicios con inject, mocks de backend con page.route).
---

# Pruebas — MIS Host

Doble pirámide: **Vitest** vía `@angular/build:unit-test` sobre jsdom, y **Playwright** para los flujos completos. Hoy hay 349 specs unitarias y 29 suites E2E en dos viewports.

---

## 1. Convenciones que hay que respetar

| Convención | Detalle |
|---|---|
| **Globales de Vitest** | `tsconfig.spec.json` declara `types: ["vitest/globals"]`. **Ningún spec importa de `'vitest'`** — 0 de 349. No agregues `import { describe, it, expect, vi } from 'vitest'`. |
| **`TestBed` para servicios** | Un servicio con `inject()` en un campo necesita contexto de inyección: no se instancia con `new`. |
| **Nada de `TestBed` para `utils/`** | Los mapeos puros se prueban directo. Son las pruebas más rápidas y las que más protegen. |
| **`src/test-setup.ts`** | Garantiza que `localStorage` y `sessionStorage` existan —jsdom no los da si el documento tiene origen opaco— y limpia `sessionStorage` antes de cada test: el caché de jerarquía se comparte entre specs del mismo worker. No dependas de ese estado. |
| **E2E sin backend real** | Sesión inyectada en `sessionStorage` (`e2e/fixtures/session.ts`) y backend mockeado con `page.route()`. Nunca Google ni Ant reales. |
| **Dos proyectos E2E** | `desktop-chromium` y `mobile-chromium` (Pixel 7, 412 px). Todo cambio de layout se prueba en ambos. |

---

## 2. Mapeos puros (`utils/*.util.spec.ts`)

Sin `TestBed`, sincrónicas, en milisegundos. Los cuatro casos que importan:

```typescript
import { mapCarteraFila, mapCarteraFilas, totalCartera } from './cartera.util';
import type { CarteraFilaDto } from '../models/cartera.model';

describe('cartera.util', () => {
  const dto: CarteraFilaDto = { cod: 'C-01', des: 'Crédito', mto: 1500.5, est: 'ACTIVO' };

  it('normaliza una fila del backend', () => {
    const fila = mapCarteraFila(dto);
    expect(fila.monto).toBe(1500.5);
    expect(fila.activo).toBe(true);
  });

  it('acepta montos en cadena, que es como los manda parte del backend', () => {
    expect(mapCarteraFila({ ...dto, mto: 'S/ 1,250.75' }).monto).toBe(1250.75);
  });

  it('trata null, undefined y campos faltantes como vacío, no como excepción', () => {
    expect(mapCarteraFilas(null)).toEqual([]);
    expect(mapCarteraFila({} as CarteraFilaDto).monto).toBe(0);
  });

  it('suma los montos', () => {
    expect(totalCartera(mapCarteraFilas([dto, { ...dto, mto: 500 }]))).toBe(2000.5);
  });
});
```

El caso del monto en cadena no es hipotético: el backend Ant devuelve números como texto formateado en varios strands. Un mapper que asume `number` produce `NaN` y la pantalla muestra un guion donde iba una cifra.

---

## 3. Servicios con transporte Winder (`services/*.service.spec.ts`)

Se dobla el `Mod*Service`, que es el borde real del sistema:

```typescript
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CarteraService } from './cartera.service';
import { ModReportesService } from '../../../../core/winder/instances/mod-reportes.service';
import { COD_CARTERA } from '../constantes/cartera.constantes';

function crear(respuesta: unknown, falla = false) {
  const getRegularTableResult = vi.fn(() =>
    falla ? throwError(() => new Error('backend caído')) : of(respuesta)
  );
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    providers: [{ provide: ModReportesService, useValue: { getRegularTableResult } }],
  });
  return { service: TestBed.inject(CarteraService), getRegularTableResult };
}

describe('CarteraService', () => {
  it('pide el cod_rep declarado en constantes', () => {
    const { service, getRegularTableResult } = crear({ body: { resultado: { data: [] } } });
    service.consultar({ nom: 'x' });
    expect(getRegularTableResult).toHaveBeenCalledWith(COD_CARTERA, { nom: 'x' });
  });

  it('publica las filas y apaga la carga', () => { /* … */ });

  // Los dos que no pueden faltar nunca:
  it('una respuesta sin filas es vacío, no error', () => {
    const { service } = crear({ body: { resultado: { data: [] } } });
    service.consultar();
    expect(service.vacio()).toBe(true);
    expect(service.error()).toBeNull();
  });

  it('un fallo del backend es error, no tabla vacía', () => {
    const { service } = crear(null, true);
    service.consultar();
    expect(service.error()).toBeTruthy();
    expect(service.vacio()).toBe(false);
  });
});
```

**Esos dos últimos tests son el corazón de la suite.** Confundir vacío con error es el defecto que degradó al sistema legado; si un spec no lo distingue explícitamente, la regresión vuelve sin que nadie se entere.

---

## 4. Componentes

Se dobla el servicio del módulo con un objeto de funciones que devuelven valores (las señales se leen llamándolas):

```typescript
import { TestBed } from '@angular/core/testing';
import { PrincipalComponent } from './principal.component';
import { CarteraService } from '../../services/cartera.service';

function montar(estado: { cargando?: boolean; error?: string | null; vacio?: boolean } = {}) {
  const consultar = vi.fn();
  TestBed.configureTestingModule({
    imports: [PrincipalComponent],
    providers: [{
      provide: CarteraService,
      useValue: {
        consultar,
        limpiar: vi.fn(),
        filas: () => [],
        cargando: () => estado.cargando ?? false,
        error: () => estado.error ?? null,
        vacio: () => estado.vacio ?? true,
        totalRegistros: () => 0,
        totalMonto: () => 0,
      },
    }],
  });
  const fixture = TestBed.createComponent(PrincipalComponent);
  fixture.detectChanges();
  return { fixture, consultar };
}

it('muestra el error con reintento y no el estado vacío', () => {
  const { fixture } = montar({ error: 'Backend caído', vacio: false });
  const texto = fixture.nativeElement.textContent as string;
  expect(texto).toContain('Backend caído');
  expect(texto).not.toContain('Sin resultados');
});
```

En zoneless, `fixture.detectChanges()` sigue siendo la forma de forzar el render en la prueba.

---

## 5. E2E con Playwright

```typescript
import { test, expect } from '@playwright/test';

test.describe('Cartera', () => {
  test.beforeEach(async ({ page }) => {
    // Backend mockeado: la suite no depende de Ant ni de Google.
    await page.route('**/v1/g**', (route) =>
      route.fulfill({ json: { resultado: { data: [{ cod: 'C-01', des: 'Crédito', mto: 100, est: 'ACTIVO' }] } } })
    );
  });

  test('carga la ruta y muestra la tabla', async ({ page }) => {
    await page.goto('/app/reportes/cartera');
    await expect(page.getByRole('heading', { name: /cartera/i })).toBeVisible();
    await expect(page.locator('p-table')).toBeVisible();
  });

  test('un fallo del backend muestra el error con reintento', async ({ page }) => {
    await page.route('**/v1/g**', (route) => route.fulfill({ status: 500 }));
    await page.goto('/app/reportes/cartera');
    await expect(page.getByRole('button', { name: /reintentar/i })).toBeVisible();
  });
});
```

E2E es **obligatorio** cuando el cambio toca una ruta, el shell, permisos, el flujo de datos o el layout responsive.

---

## 6. Comandos

```bash
node governance/scripts/ejecutar-pruebas.mjs unit
node governance/scripts/ejecutar-pruebas.mjs unit src/app/pages/modules/analista
node governance/scripts/ejecutar-pruebas.mjs watch
node governance/scripts/ejecutar-pruebas.mjs coverage
node governance/scripts/ejecutar-pruebas.mjs e2e
node governance/scripts/ejecutar-pruebas.mjs e2e:ui
node governance/scripts/ejecutar-pruebas.mjs verificar      # estático, sin compilar
node governance/scripts/ejecutar-pruebas.mjs ci --con-e2e   # la cadena del pipeline
```

---

## 7. Dos falsos verdes

- **Contar specs no es cobertura.** 349 archivos no dicen qué reglas de negocio están cubiertas; varias pruebas comparten los mismos mocks.
- **El E2E no valida el backend real**, por diseño. No sirve como evidencia de autorización: eso se prueba contra el backend, no contra el frontend que lo mockea.

Falta cobertura automatizada de rutas contra menú, de `cod_rep` contra servicios y de autorización real. Está registrado como brecha en [`test-inventory`](../../docs/development/test-inventory.md); no lo afirmes como resuelto.
