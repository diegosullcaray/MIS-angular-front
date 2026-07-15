# MIS — Plantilla de Sistema Hijo (Remote)

Plantilla oficial del **frontend de un sistema hijo** del MIS (Management Information
System). Un sistema hijo es un micro-frontend independiente que el **MIS Host** embebe en
tiempo de ejecución mediante **Native Federation** (sin iframes).

> 📚 Documentación de la plantilla en [`docs_proyecto/`](./docs_proyecto):
> [01 PRD](./docs_proyecto/01_PRD_PLANTILLA.md) ·
> [02 Indicaciones y Restricciones](./docs_proyecto/02_INDICACIONES_Y_RESTRICCIONES.md) ·
> [03 Plan de Implementación](./docs_proyecto/03_IMPLEMENTATION_PLAN.md)
>
> 📚 Referencia obligatoria del Host: `MIS-angular-front/docs_proyecto/08_GUIA_SISTEMAS_HIJOS.md`

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Angular 22 · Standalone · **Zoneless** (sin `zone.js`) |
| Federación | `@angular-architects/native-federation` (Remote, expone `./Component`) |
| UI | PrimeNG 21 + preset **MisTheme** + tokens `--mis-*` (copiados del Host) |
| Estilos | Tailwind CSS v4 |
| Formularios | **Signal Forms** (`@angular/forms/signals`) — `ReactiveFormsModule` prohibido |

## Inicio rápido

```bash
npm install --legacy-peer-deps
npm start          # remote aislado en http://localhost:4210
npm run build      # genera dist/ con remoteEntry.json (federación)
```

## Al clonar la plantilla (obligatorio)

1. `federation.config.mjs` → `name: 'subsistema-<dominio>'`
2. `src/app/core/shell-contract/shell-contract.service.ts` → `SLUG_SUBSISTEMA`
3. `angular.json` → puertos (`serve` / `serve-original`) según la convención de la guía 08 §3
4. `package.json` → `name` · `src/index.html` → `<title>`
5. Reemplazar `src/app/pages/*` por las vistas del dominio

## Estructura

```
├── docs_proyecto/                  ← PRD, restricciones y plan del front
├── federation.config.mjs           ← ★ slug + exposes './Component'
├── src/
│   ├── main.ts                     ← initFederation() → bootstrap
│   ├── bootstrap.ts                ← arranque standalone (desarrollo aislado)
│   └── app/
│       ├── remote-root.component.ts  ← ★ componente EXPUESTO al Host (export default)
│       ├── app.ts / app.config.ts    ← shell de desarrollo aislado (Zoneless + MisTheme)
│       ├── core/
│       │   ├── design-system/        ← mis-theme.ts + tokens.css (copia del Host)
│       │   ├── shell-contract/       ← lectura del estado del Host (solo lectura, RN-03)
│       │   └── interceptors/         ← JWT del Host → backend propio
│       ├── pages/                    ← vistas del dominio (las de ejemplo se reemplazan)
│       └── shared/ui/                ← componentes propios del dominio
├── Dockerfile                      ← build Angular → nginx
└── nginx.conf                      ← CORS para remoteEntry.json (requerido por el Host)
```

## Cómo se embebe en el Host

1. El Host declara el remote en su `public/federation.manifest.json`:
   ```json
   { "subsistema-<dominio>": "http://localhost:<puerto>/remoteEntry.json" }
   ```
2. Un `admin-sistema` lo registra en **`/admin/sistemas`** (mismo slug), define su
   **Estructura** y asigna **permisos por rol**.
3. Habilitado el subsistema en un rol, su ícono aparece en el sidebar del Host y la ruta
   `/{slug}/**` carga este remote vía `RemoteWrapperComponent`.

## Reglas de oro (resumen — detalle en doc 02)

- Solo área de contenido: **sin header/sidebar propios** (RN-01).
- **Solo lectura** del estado de la shell; cero mutaciones (RN-03).
- HTTP únicamente al **backend propio** `/api/<dominio>/v1/*` con el JWT del Host (RN-02).
- Versiones de `@angular/*`, `primeng` y `rxjs` **idénticas a las del Host** (RN-05).
- Prohibidos: `zone.js`, iframes, `ReactiveFormsModule`, Tailwind v3, NgModules con `forRoot()`.
