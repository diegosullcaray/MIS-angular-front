---
name: mis-testing-guide
description: Metodología y estándares de pruebas unitarias con Vitest y pruebas E2E con Playwright en MIS Host. Usar para escribir tests de mappers, servicios, componentes OnPush y flujos de usuario completos según governance/docs/development/testing.md.
---

# Guía de Pruebas Unitarias y E2E — MIS Host

En **MIS Host (Financiera Confianza)**, la calidad del software se valida mediante una doble pirámide:
1. **Pruebas Unitarias de Alta Velocidad (Vitest)**: Vía `@angular/build:unit-test` y `jsdom`.
2. **Pruebas de Extremo a Extremo (Playwright)**: Validando navegación real, autenticación, guards y tablas de reportes.

---

## 1. Pruebas Unitarias con Vitest

### Testing de Mappers Puros (`utils/*.mappers.spec.ts`)
Los mappers puros no necesitan `TestBed`. Son pruebas sincrónicas ultra-rápidas:

```typescript
import { describe, it, expect } from 'vitest';
import { mapCarteraDtoToItem } from './cartera.mappers';

describe('Cartera Mappers', () => {
  it('debe transformar y formatear moneda adecuadamente', () => {
    const dto = { id: '1', monto: 1250.5, estado: 'ACTIVO' };
    const res = mapCarteraDtoToItem(dto);

    expect(res.montoFormateado).toContain('1.250');
    expect(res.esActivo).toBe(true);
  });
});
```

### Testing de Servicios con Signals (`services/*.service.spec.ts`)
Evitar la complejidad de `TestBed` cuando sea posible; instanciar la clase directamente inyectando el mock del cliente HTTP:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { CarteraService } from './cartera.service';
import { of, throwError } from 'rxjs';

describe('CarteraService', () => {
  let service: CarteraService;
  let httpMock: any;

  beforeEach(() => {
    httpMock = { get: () => of([]) };
    service = new (CarteraService as any)();
    (service as any).http = httpMock;
  });

  it('debe actualizar las señales reactivas al recibir datos', () => {
    httpMock.get = () => of([{ id: '1', monto: 500, estado: 'ACTIVO' }]);

    service.consultar({}).subscribe(() => {
      expect(service.items().length).toBe(1);
      expect(service.cargando()).toBe(false);
      expect(service.error()).toBeNull();
    });
  });

  it('debe registrar el error en la señal si la API responde error', () => {
    httpMock.get = () => throwError(() => new Error('Server down'));

    service.consultar({}).subscribe(() => {
      expect(service.cargando()).toBe(false);
      expect(service.error()).toContain('Error al consultar');
    });
  });
});
```

---

## 2. Pruebas End-to-End con Playwright (`e2e/`)

Las pruebas E2E verifican los flujos críticos del negocio y las garantías de seguridad:
- Que las rutas protegidas no sean accesibles sin autenticación.
- Que las tablas de reportes rendericen filas con datos de prueba o mock.
- Que los estados de error muestren el botón de reintento.

### Estructura de un Test E2E:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Módulo de Cartera', () => {
  test('debe cargar la vista y permitir recarga', async ({ page }) => {
    await page.goto('/cartera');
    await expect(page.locator('h1')).toContainText('Cartera');

    // Comprobar presencia de tabla o estado vacío
    const table = page.locator('p-table');
    await expect(table).toBeVisible();
  });
});
```

---

## 3. Comandos de Ejecución

Usar siempre el lanzador unificado del proyecto:

```bash
# Pruebas unitarias
node governance/scripts/ejecutar-pruebas.mjs unit

# Modo observador interactivo
node governance/scripts/ejecutar-pruebas.mjs watch

# Reporte de cobertura
node governance/scripts/ejecutar-pruebas.mjs coverage

# Pruebas E2E
node governance/scripts/ejecutar-pruebas.mjs e2e
```
