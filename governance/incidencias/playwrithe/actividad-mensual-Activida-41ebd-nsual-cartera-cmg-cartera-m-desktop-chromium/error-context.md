# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: actividad-mensual.spec.ts >> Actividad Mensual — smoke de las 35 rutas migradas >> CMG Cartera resuelve en /app/reportes/repositorio/actividad-mensual/cartera/cmg-cartera-m
- Location: e2e\actividad-mensual.spec.ts:57:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  getByRole('heading', { name: 'CMG Cartera', exact: true })
Expected: visible
Received: undefined

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'CMG Cartera', exact: true })
  - Protocol error (Runtime.evaluate): Internal server error, session closed.

```

```
Error: browserContext.close: Target page, context or browser has been closed
```