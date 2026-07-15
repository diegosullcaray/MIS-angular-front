# 02 — Indicaciones y Restricciones del Sistema Hijo (Frontend)
> **Proyecto:** MIS — Plantilla base de sistema hijo (frontend)  
> **Documentación Activa:** [01_PRD_PLANTILLA](./01_PRD_PLANTILLA.md) | [02_INDICACIONES_Y_RESTRICCIONES](./02_INDICACIONES_Y_RESTRICCIONES.md) | [03_IMPLEMENTATION_PLAN](./03_IMPLEMENTATION_PLAN.md)  
> **Versión:** 1.0.0  
> **Fecha:** 2026-07-14  
> **Estado:** 🟢 Vigente — de cumplimiento obligatorio para pasar la revisión de integración

Este documento consolida **todas las reglas que un sistema hijo debe cumplir** para ser
embebido en el MIS. Se deriva de la documentación del Host (PRD, TRD, doc 02 y guía 08).
El incumplimiento de cualquier regla 🔴 bloquea la integración.

---

## 1. Reglas de negocio del MIS (no negociables) 🔴

| # | Regla | Implicación para este frontend |
|---|---|---|
| **RN-01** | El Host es dueño de header, sidebar y URL base | El remote **no** renderiza chrome propio (ni header, ni sidebar, ni breadcrumb, ni títulos de página con "Volver"); solo su área de contenido. |
| **RN-02** | Aislamiento total | Sin dependencias rígidas con el Host. El frontend consume **únicamente su backend propio** (`/api/<dominio>/v1/*`); jamás llama a `/api/v1/*` del Host. |
| **RN-03** | Comunicación solo por lectura | El remote lee `usuarioActivo()`, `esAdmin()`, `subsistemas()`… del contrato de la shell y **nunca muta** estado del Host (ni sessionStorage `mis.sesion`, ni setters). |
| **RN-04** | Prohibido `iframe` | La integración es exclusivamente vía `loadRemoteModule` de Native Federation. |
| **RN-05** | Sin recarga del navegador | Singletons compartidos (`shareAll` + `strictVersion`): las versiones de `@angular/*`, `primeng` y `rxjs` **deben coincidir con las del Host**. |
| **RN-06** | Error elegante | Si el remote cae, el Host muestra su `RemoteErrorComponent`; el hijo no debe romper la shell (sin errores globales no capturados en el arranque del componente expuesto). |
| **PG-06** | Tema compartido | Mismo preset **MisTheme** + tokens `--mis-*` del Host, `ripple: false`. |

---

## 2. Contrato técnico con el Host 🔴

### 2.1 Federación

- `federation.config.mjs` → `name` = **slug** del subsistema (`subsistema-<dominio>`, kebab-case).
- El slug es el **identificador universal**: manifest del Host, ruta `/{slug}/**`, registro
  en Gestión de Sistemas y claim `subsistemas` del JWT. Debe ser idéntico en todos.
- `exposes: { './Component': './src/app/remote-root.component.ts' }` — no renombrar la clave.
- El componente expuesto se exporta como **`default`** (el wrapper también acepta
  `AppComponent` o `RemoteRootComponent` como export nombrado).
- `shared: shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto', build: 'package' })`
  con el override de `@angular/core` (`includeSecondaries: keepAll`) — copiar tal cual de esta plantilla.

### 2.2 Deep-linking y navegación

- El Host enruta `/{slug}/**` al remote: **cualquier subruta** carga el mismo componente raíz.
- El remote decide su vista inicial **leyendo la URL** (`inject(Router).url`).
- La navegación interna usa signals y/o `router.navigate` a subrutas del mismo slug;
  el breadcrumb del Host las muestra automáticamente (HD-02).
- Prohibido registrar rutas de primer nivel o alterar la URL fuera de `/{slug}/...`.

### 2.3 Contrato de la shell (estado del Host)

| Signal (solo lectura) | Tipo | Uso típico |
|---|---|---|
| `usuarioActivo()` | `UsuarioActivo \| null` | Personalizar vistas, autor de operaciones |
| `esAdminSistema()` / `esAdmin()` | `boolean` | Ocultar acciones administrativas |
| `subsistemas()` | `string[]` | Verificación defensiva de acceso propio |
| `token()` | `string \| null` | Adjuntar al backend propio (interceptor) |

- Implementación en esta plantilla: `core/shell-contract/shell-contract.service.ts`
  (lee la sesión persistida por el Host). Cuando se publique el paquete
  `@confianza/mis-shell`, se reemplaza por el servicio del paquete (guía 08 §4.6).
- **Prohibido** invocar métodos de mutación del Host (`setUsuarioActivo`,
  `cerrarSesion`, `setMenuItemActivo`, …). Los remotes que lo hagan **no pasan revisión**.

### 2.4 HTTP y seguridad

- Prefijo del backend propio: `/api/<dominio>/v1/*` (proxy del mismo dominio en producción).
- Cada petición adjunta el **JWT emitido por el Host** (`Authorization: Bearer`);
  el backend hijo valida firma, expiración y que el claim `subsistemas` contenga el slug.
- El frontend hijo **no implementa login** ni refresca tokens: la sesión es del Host.
- El nginx del hijo sirve `remoteEntry.json` y assets con **CORS habilitado hacia el
  dominio del Host**; `remoteEntry.json` sin caché.

---

## 3. Restricciones de stack (heredadas del TRD del Host) 🔴

| Restricción | Detalle |
|---|---|
| **Zoneless obligatorio** | `provideZonelessChangeDetection()`; `zone.js` **prohibido** en polyfills, imports y bundle. |
| **Signal Forms** | Formularios con `@angular/forms/signals` (`form()`, `[formField]`, validadores). **`ReactiveFormsModule` prohibido** (`FormGroup`/`FormControl`/`FormBuilder`). |
| **Signals para UI** | `signal()` / `computed()` / `effect()`; sin `ChangeDetectorRef`. En Zoneless, el estado que cambia tras un `await` debe vivir en signals. |
| **Standalone puro** | Sin `NgModule`; prohibidos paquetes que exijan `forRoot()`. |
| **Tailwind v4** | `@import "tailwindcss"` en CSS. **Prohibido** Tailwind v3 (`tailwind.config.js`, directivas `@tailwind`). |
| **PrimeNG + MisTheme** | Componentes complejos con PrimeNG; preset `MisTheme` + tokens `--mis-*` para colores/espaciado; `ripple: false`. |
| **TypeScript estricto** | `strict: true`; convenciones de naming del TRD §5.2 (`kebab-case.component.ts`, etc.). |
| **Versiones alineadas** | `package.json` de esta plantilla = referencia publicada por el Host. Actualizaciones de framework **solo coordinadas** con el equipo del Host. |
| **Native Federation** | Prohibido Webpack Module Federation (`@angular/module-federation`). |

### Paquetes prohibidos

`zone.js` · `@angular/module-federation` (webpack) · `tailwindcss@3.x` ·
plugins Tailwind v3 (`@tailwindcss/forms`, `@tailwindcss/typography`) ·
cualquier NgModule de terceros con `forRoot()`.

---

## 4. Indicaciones de UI/UX (doc 02 del Host)

- Toda vista de gestión se encapsula en una **`p-card` a ancho completo** con:
  header de card (título + descripción + acción principal) y body (tablas, formularios, pestañas).
- Subsecciones de detalle/edición con **`<p-selectButton>`** segmentado (RN-07 del PRD).
- Sin títulos de página ni enlaces "Volver": el contexto lo da el breadcrumb del Host (HD-01).
- Estados obligatorios: skeleton al cargar, `EmptyState` cuando no hay datos,
  error inline con Reintentar; confirmaciones destructivas con `p-dialog`.
- Íconos: PrimeIcons en botones PrimeNG; `@ng-icons/lucide` en vistas.
- Textos de UI en español (es-PE); fechas con `toLocaleDateString('es-PE', …)`.

---

## 5. Convenciones del repositorio

| Elemento | Convención | Ejemplo |
|---|---|---|
| Nombre del repo | `mis-remote-<dominio>` | `mis-remote-reportes` |
| Slug | `subsistema-<dominio>` | `subsistema-reportes` |
| Puerto front (dev) | Asignado por la tabla de la guía 08 §3 | Reportes → 4205 |
| Prefijo API propia | `/api/<dominio>/v1/*` | `/api/reportes/v1/*` |
| Estructura de carpetas | La de esta plantilla (ver README) | `pages/`, `core/`, `shared/ui/` |

### Puntos que se editan al clonar (y nada más de la base)

1. `federation.config.mjs` → `name`
2. `core/shell-contract/shell-contract.service.ts` → `SLUG_SUBSISTEMA`
3. `angular.json` → puertos de `serve` y `serve-original`
4. `package.json` → `name`
5. `pages/` → vistas reales del dominio (las de ejemplo se eliminan)
6. `index.html` → `<title>`

> ⚠️ **No modificar** sin coordinación con el Host: `federation.config.mjs` (shared/skip),
> `main.ts`/`bootstrap.ts`, `core/design-system/*` (se sincroniza desde el Host),
> versiones del `package.json`.

---

## 6. Checklist de integración (definition of done)

- [ ] Slug `subsistema-<dominio>` consistente en federation.config, `SLUG_SUBSISTEMA`, manifest del Host y registro IAM.
- [ ] Frontend zoneless, sin `zone.js` en el bundle; versiones alineadas al Host.
- [ ] Expone `./Component` con export `default`.
- [ ] Sin header/sidebar propios; MisTheme + tokens `--mis-*`.
- [ ] Solo **lee** el contrato de la shell; cero mutaciones.
- [ ] HTTP únicamente al backend propio, con el JWT del Host.
- [ ] CORS del `remoteEntry.json` habilitado para el dominio del Host.
- [ ] Registrado en `federation.manifest.json` + alta en `/admin/sistemas` con estructura y permisos por rol.
- [ ] Probados los 3 estados del wrapper: skeleton, contenido y error elegante con el hijo apagado (CA-04/CA-05 del Host).
