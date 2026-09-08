# Setup local

## Requisitos

- Node 22 o superior (es la versión que usa el pipeline).
- npm 11 — el proyecto declara `packageManager: npm@11.15.0`.

## Puesta en marcha

```bash
npm install
npm start                 # ng serve en http://localhost:4200
```

Para E2E hace falta el navegador de Playwright:

```bash
npx playwright install chromium
```

## Comandos habituales

```bash
npm run verify            # gobernanza, documentación, tokens e inventarios (rápido, pre-commit)
npm test                  # unitarias (Vitest)
npm run e2e               # end-to-end (Playwright, levanta ng serve en el puerto 4300)
npm run build:prod        # build de producción + control de bundle
npm run module:create     # generador de módulos
```

El catálogo completo: `node governance/scripts/ejecutar-pruebas.mjs help` y [compuertas de calidad](./quality-gates.md).

## Entornos

`src/environments/environment.ts` se reemplaza por `environment.prod.ts` en el build de producción (`fileReplacements` en `angular.json`). Contienen URL de Ant, secretos por `appId`, configuración OAuth y enlaces externos.

**No pongas secretos reales nuevos ahí.** Los que hay ya viajan en el bundle público y están registrados como riesgo abierto en [hallazgos de seguridad](../security/findings.md): la remediación exige cambiar el modelo del backend, no mover la cadena de archivo.

## Verificá que quedó bien

```bash
npm run verify   # debería terminar sin hallazgos nuevos
npm test
```

Si `verify` falla en la primera corrida sin que hayas tocado nada, el mensaje indica qué comando lo reproduce por separado.
