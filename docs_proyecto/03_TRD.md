# 03 — Technical Requirements Document (TRD)
> **Proyecto:** MIS - Management Information System  
> **Documentación Activa:** [01_PRD](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/01_PRD.md) | [02_UI_UX_APP_FLOW](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/02_UI_UX_APP_FLOW.md) | [03_TRD](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/03_TRD.md) | [04_BACKEND_SCHEMA](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/Backend/04_BACKEND_SCHEMA.md) | [05_IMPLEMENTATION_PLAN](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/05_IMPLEMENTATION_PLAN.md) | [06_FIGMA_UX_KIT_GUIDE](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/FIGMA/06_FIGMA_UX_KIT_GUIDE.md) | [08_GUIA_SISTEMAS_HIJOS](file:///f:/FINACIERA%20CONFIANZA/DESARROLLO/mis-host/docs_proyecto/08_GUIA_SISTEMAS_HIJOS.md)  
> **Versión:** 1.2.0  
> **Fecha:** 2026-07-14  
> **Estado:** 🟢 Alineado a la implementación

---

## 1. Stack Tecnológico Base

| Capa | Tecnología | Versión | Notas |
|---|---|---|---|
| Framework UI | Angular | 21 / 22 | Última versión estable al momento del inicio |
| Lenguaje | TypeScript | ≥ 5.4 | `strict: true` obligatorio |
| Federación | `@angular-architects/native-federation` | latest | Reemplaza completamente Webpack/Module Federation |
| Librería UI | **PrimeNG** | 19+ | Componentes base (Table, Dialog, Toast, Menu, Sidebar...) |
| Estilos | **Tailwind CSS v4** | 4.x | Utilidades responsive; Tailwind v3 **no se usa** |
| Tema PrimeNG | **PrimeNG + Tailwind Preset** | — | Tema personalizado estilo macOS minimalista |
| Runtime | Node.js | ≥ 20 LTS | Solo para build y dev-server |
| Contenedores | Docker | — | Una imagen por subsistema |
| Orquestación | Dokploy / Coolify | — | Despliegue independiente por Remote |

---

## 2. Paquetes NPM Obligatorios

### 2.1 Instalación Requerida

```bash
# Federación (OBLIGATORIO — reemplaza Webpack)
npm install @angular-architects/native-federation

# PrimeNG (componentes UI)
npm install primeng @primeng/themes

# PrimeIcons (iconos oficiales de PrimeNG)
npm install primeicons

# Tailwind CSS v4 (IMPORTANTE: v4, no v3)
npm install tailwindcss @tailwindcss/vite

# Íconos SVG estilo Lucide (usados en vistas del Host; PrimeIcons queda para
# el sidebar y los botones de PrimeNG)
npm install @ng-icons/core @ng-icons/lucide

# Utilidades de Angular
npm install @angular/cdk
```

> ⚠️ **CRITICO:** Usar **Tailwind CSS v4** exclusivamente. Tailwind v3 usa `tailwind.config.js` y `@tailwind` directives — esa API está **prohibida**. Tailwind v4 se integra directamente via `@import "tailwindcss"` en el CSS.

### 2.2 Configuración Tailwind v4 en `styles.css`

```css
/* src/styles.css */
@import "tailwindcss";

/* Tokens del tema macOS minimalista (ver Sección 9) */
@import "./app/core/design-system/tokens.css";
```

### 2.3 Paquetes Prohibidos

| Paquete | Razón de Prohibición |
|---|---|
| `zone.js` | Arquitectura Zoneless — prohibido en todos los niveles |
| `@angular/module-federation` (webpack) | Reemplazado por Native Federation |
| `tailwindcss@3.x` | Solo se usa Tailwind v4 |
| `@tailwindcss/forms`, `@tailwindcss/typography` (v3 plugins) | Incompatibles con Tailwind v4 |
| Cualquier `NgModule` de terceros que requiera `forRoot()` | Incompatible con arquitectura Standalone pura |

---

## 3. Configuración de Angular (`angular.json`)

### 3.1 Builder

```json
{
  "architect": {
    "build": {
      "builder": "@angular-architects/native-federation:build",
      "options": {
        "target": "browser",
        "outputPath": "dist/mis-host"
      }
    },
    "serve": {
      "builder": "@angular-architects/native-federation:build-dev-server",
      "options": {
        "port": 4200
      }
    }
  }
}
```

### 3.2 Configuración de Native Federation (`federation.config.js`)

```javascript
// Host
const { withNativeFederation, shareAll } = require('@angular-architects/native-federation/config');

module.exports = withNativeFederation({
  name: 'mis-host',
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' })
  },
  remotes: {}  // Se cargan dinámicamente desde federation.manifest.json
});
```

### 3.3 Manifest de Federación (`public/federation.manifest.json`)

```json
{
  "subsistema-contabilidad": "http://localhost:4201/remoteEntry.json",
  "subsistema-rrhh": "http://localhost:4202/remoteEntry.json"
}
```

> En producción, estas URLs apuntan a las imágenes Docker desplegadas en el registry privado.

---

## 4. Configuración de la Aplicación (`app.config.ts`)

```typescript
import { ApplicationConfig, inject, provideAppInitializer, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { MessageService } from 'primeng/api';
import { MisTheme } from './core/design-system/mis-theme';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { fakeApiInterceptor } from './core/fake-api/fake-api.interceptor';
import { AuthService } from './pages/full-pages/auth/service/auth.service';
import { APP_ROUTES } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // ✅ OBLIGATORIO: Modo Zoneless
    provideZonelessChangeDetection(),

    // ✅ Router con binding de inputs de componentes
    provideRouter(APP_ROUTES, withComponentInputBinding()),

    // ✅ HttpClient con Fetch API + interceptores.
    //    fakeApiInterceptor simula el backend REST (/api/v1/*) en memoria:
    //    quitarlo de esta lista al conectar el backend real (doc 04 §8).
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, fakeApiInterceptor])),

    // ✅ Restaura la sesión persistida (sessionStorage 'mis.sesion') antes de
    //    renderizar, para que authGuard no expulse al usuario al refrescar.
    provideAppInitializer(() => inject(AuthService).restaurarSesion()),

    // ✅ Animaciones async (requerido por PrimeNG)
    provideAnimationsAsync(),

    // ✅ PrimeNG con tema personalizado estilo macOS
    providePrimeNG({
      theme: {
        preset: MisTheme,
        options: {
          darkModeSelector: '.dark',
          cssLayer: { name: 'primeng', order: 'theme, base, primeng, utilities' }
        }
      },
      ripple: false,  // Sin ripple — estilo macOS no usa ripple
    }),

    // ✅ Toasts globales (consumidos vía ToastService + <p-toast> en el root)
    MessageService,
  ]
};
```

> ⚠️ `zone.js` **NO debe importarse** en `main.ts` ni en `polyfills`. Verificar que no exista en `angular.json > polyfills`.

---

## 5. Convenciones de Arquitectura

### 5.1 Regla de Aislamiento de Features

```
✅ PERMITIDO:
  pages/modules/admin/services/accesos.service.ts  →  core/services/shell-state.service.ts
  pages/modules/admin/components/...               →  shared/ui/...

❌ PROHIBIDO:
  pages/modules/admin/...     →  pages/modules/inicio/...  (import directo entre módulos)
  pages/full-pages/auth/...   →  pages/modules/... (componentes)

⚠️ Excepción documentada: el layout (sidebar/header) y el módulo `inicio` LEEN los
   services públicos del módulo `admin` (`sistemas.service`, `accesos.service`)
   para pintar menús y KPIs — solo la capa service, nunca componentes de otro módulo.
```

### 5.2 Convenciones de Naming

| Artefacto | Patrón | Ejemplo |
|---|---|---|
| Componente Standalone | `kebab-case.component.ts` | `shell-layout.component.ts` |
| Servicio Singleton | `kebab-case.service.ts` | `shell-state.service.ts` |
| Modelo / Interface | `kebab-case.model.ts` | `catalogo.model.ts` |
| Ruta | `kebab-case.routes.ts` | `catalogos.routes.ts` |
| Guard | `kebab-case.guard.ts` | `auth.guard.ts` |

### 5.3 Estructura de Carpetas del Host

```
src/
├── app/
│   ├── app.component.ts          ← Root component (Standalone)
│   ├── app.config.ts             ← Providers globales (Zoneless, Router, Http, PrimeNG)
│   ├── app.routes.ts             ← Rutas raíz del Host
│   │
│   ├── core/
│   │   ├── design-system/          ← Tema y tokens macOS
│   │   │   ├── mis-theme.ts          ← Preset PrimeNG personalizado
│   │   │   └── tokens.css            ← CSS custom properties (light + .dark)
│   │   ├── fake-api/               ← Backend simulado (contrato 1:1 con doc 04)
│   │   │   ├── fake-db.ts            ← Seeds en memoria (usuarios, roles, sistemas)
│   │   │   └── fake-api.interceptor.ts
│   │   ├── federation/
│   │   │   └── remote-wrapper/       ← RemoteWrapperComponent (effect sobre remoteName)
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── role.guard.ts         ← jerarquía de roles + toast de acceso denegado
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts   ← adjunta Authorization + X-User-Role
│   │   └── services/
│   │       └── shell-state.service.ts
│   │
│   ├── pages/
│   │   ├── full-pages/
│   │   │   ├── auth/                 ← LoginComponent y flujo MFA
│   │   │   ├── error/                ← NotFoundComponent
│   │   │   └── layout/               ← ShellLayout, Header y Sidebar
│   │   └── modules/                  ← Solo 2 módulos: inicio y admin
│   │       ├── inicio/               ← Módulo Inicio (dashboard "Mi espacio")
│   │       │   ├── inicio.routes.ts
│   │       │   └── components/inicio/
│   │       └── admin/                ← Módulo Admin (exclusivo admin-sistema)
│   │           ├── admin.routes.ts
│   │           ├── models/             ← sistema.model.ts · acceso.model.ts
│   │           ├── services/           ← sistemas.service.ts · accesos.service.ts
│   │           └── components/
│   │               ├── gestion-sistemas/   ← sistemas-list · sistema-detalle (Detalle General|Estructura|Roles) · sistema-form
│   │               ├── gestion-roles/      ← roles-list · rol-detalle (Detalle General|Usuarios) · rol-form
│   │               └── gestion-usuarios/   ← usuarios-list · usuario-detalle (Información General|Roles) · usuario-form
│   │
│   └── shared/
│       └── ui/
│           ├── remote-skeleton/
│           ├── remote-error/
│           ├── empty-state/
│           ├── inline-error/
│           ├── list-skeleton/
│           ├── toast/                ← ToastService (fachada sobre MessageService de PrimeNG)
│           └── access-denied/
│
├── public/
│   └── federation.manifest.json
│
├── styles.css                    ← Entry CSS: @import tailwindcss + tokens
├── federation.config.js
├── angular.json
└── tsconfig.json
```

---

## 6. Change Detection Strategy

| Artefacto | Estrategia | Fundamento |
|---|---|---|
| Todos los componentes | **Zoneless** (`provideExperimentalZonelessChangeDetection`) | Arquitectura sin zone.js |
| Actualización de UI | **Signals** (`signal()`, `computed()`, `effect()`) | Reactividad granular sin `ChangeDetectorRef` |
| Comunicación Host→Remote | **Signal de solo lectura** (`asReadonly()`) | Contrato seguro, Remote no puede mutar estado del Host |

### 6.1 Manejo de Formularios (Signal Forms - Angular 22+)

A partir de Angular 22, **Signal Forms** (`@angular/forms/signals`) es el estándar oficial y obligatorio para nuevos desarrollos. Se prohíbe el uso de `ReactiveFormsModule` (`FormGroup`, `FormControl`, `FormBuilder`) en nuevos componentes para mantener la consistencia con la arquitectura Zoneless y basada en Signals.

#### Principios de Signal Forms en el Proyecto:
1. **Modelo como Fuente Única de Verdad:** Los datos del formulario se almacenan en un `signal` común de TypeScript (`loginModel = signal({ email: '', password: '' })`).
2. **Estructura Reactiva (`FieldTree`):** El árbol del formulario se crea pasando el signal del modelo a la función `form()`:
   ```typescript
   protected myForm = form(this.myModel, (schema) => {
     required(schema.email, { message: 'El correo electrónico es requerido.' });
     email(schema.email, { message: 'Introduce un correo electrónico válido.' });
   });
   ```
3. **Vinculación en Plantilla:** Se utiliza la directiva `[formField]` de `@angular/forms/signals` para la vinculación bidireccional automática:
   ```html
   <input [formField]="myForm.email" />
   ```
4. **Estados Reactivos:** Todos los estados (`valid`, `invalid`, `touched`, `dirty`, `errors`) se leen llamando al nodo como una función signal (`myForm.email().invalid()`, `myForm.email().errors()`).

---

## 7. Estrategia de Despliegue

| Componente | Imagen Docker | Puerto Interno | Orquestación |
|---|---|---|---|
| MIS Host | `registry.privado/mis-host:latest` | 80 | Dokploy / Coolify |
| Remote Contabilidad | `registry.privado/remote-contabilidad:latest` | 80 | Independiente |
| Remote RRHH | `registry.privado/remote-rrhh:latest` | 80 | Independiente |

### Dockerfile Base (Host)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist/mis-host /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

---

## 8. TypeScript — Configuración Mínima (`tsconfig.json`)

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "useDefineForClassFields": false,
    "experimentalDecorators": true,
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler"
  }
}
```

---

## 9. Design System — Estilo macOS Minimalista

El sistema de diseño sigue la estética **macOS / Apple HIG**: limpio, espacioso, tipografía clara, sombras muy sutiles, colores neutros con un acento único. Se implementa mediante:
1. Un **preset PrimeNG personalizado** (`mis-theme.ts`) que sobreescribe los tokens de componentes
2. **CSS custom properties** (`tokens.css`) que unifica colores, tipografía y espaciado
3. **Clases Tailwind v4** para layout responsive y utilidades

### 9.1 Paleta de Colores

| Token | Valor (Light) | Valor (Dark) | Uso |
|---|---|---|---|
| `--mis-bg` | `#F4F6F9` | `#111827` | Fondo general de la aplicación |
| `--mis-surface` | `#FFFFFF` | `#1F2937` | Superficie de cards y paneles |
| `--mis-sidebar-bg` | `#1D396E` | `#162D58` | Col 1 (tira de íconos) — color primario |
| `--mis-panel-bg` | `#F8FAFC` | `#1A2740` | Col 2 (panel de navegación) |
| `--mis-border` | `rgba(29,57,110,0.10)` | `rgba(66,173,224,0.12)` | Bordes sutiles de tono marca |
| `--mis-primary` | `#1D396E` | `#2A4E8F` | **Color primario** — Navy institucional |
| `--mis-primary-hover` | `#162D58` | `#1D396E` | Hover del primario (más oscuro) |
| `--mis-primary-light` | `#E8EDF5` | `#1D2D45` | Fondo suave primario (chips, badges) |
| `--mis-secondary` | `#42ADE0` | `#5BBDE8` | **Color secundario** — Azul cielo |
| `--mis-secondary-hover` | `#2F9FD4` | `#42ADE0` | Hover del secundario |
| `--mis-secondary-light` | `#E8F6FC` | `#1A3A4D` | Fondo suave secundario |
| `--mis-accent` | `#42ADE0` | `#5BBDE8` | Acento interactivo (links, focus, íconos activos) |
| `--mis-text-primary` | `#1D396E` | `#F0F4FF` | Texto principal (color primario en light) |
| `--mis-text-secondary` | `#5A6A85` | `#94A3B8` | Texto secundario / labels |
| `--mis-text-tertiary` | `#94A3B8` | `#64748B` | Texto deshabilitado / placeholders |
| `--mis-text-on-primary` | `#FFFFFF` | `#FFFFFF` | Texto sobre fondo primario |
| `--mis-text-on-secondary` | `#FFFFFF` | `#0F1E2E` | Texto sobre fondo secundario |
| `--mis-border-strong` | `rgba(29,57,110,0.20)` | `rgba(66,173,224,0.25)` | Bordes de inputs y elementos interactivos |
| `--mis-success` / `--mis-success-light` | `#16A34A` / `#E7F6EC` | `#4ADE80` / `#12331E` | Estados positivos (badges ONLINE, toasts success) |
| `--mis-warning` / `--mis-warning-light` | `#B45309` / `#FEF3C7` | `#FBBF24` / `#3A2E10` | Advertencias (MANTENIMIENTO, acceso denegado) |
| `--mis-danger` / `--mis-danger-light` | `#DC2626` / `#FDECEC` | `#F87171` / `#3B1A1A` | Errores y acciones destructivas |

### 9.2 Tipografía

```css
/* tokens.css */
:root {
  /* Fuente principal: stack macOS con fallback Inter */
  --mis-font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;

  /* Escala tipográfica */
  --mis-text-xs:   11px;   /* Labels de íconos en Col 1 del sidebar */
  --mis-text-sm:   13px;   /* Texto secundario, metadatos */
  --mis-text-base: 15px;   /* Texto base del body */
  --mis-text-lg:   17px;   /* Títulos de sección en Col 2 */
  --mis-text-xl:   22px;   /* Títulos de vista */
  --mis-text-2xl:  28px;   /* Títulos principales */

  /* Peso */
  --mis-font-normal:   400;
  --mis-font-medium:   500;
  --mis-font-semibold: 600;

  /* Line height */
  --mis-leading-tight:  1.2;
  --mis-leading-normal: 1.5;
}
```

### 9.3 Espaciado y Bordes

```css
:root {
  /* Espaciado base (múltiplos de 4px — igual que Apple HIG) */
  --mis-space-1:  4px;
  --mis-space-2:  8px;
  --mis-space-3:  12px;
  --mis-space-4:  16px;
  --mis-space-6:  24px;
  --mis-space-8:  32px;
  --mis-space-12: 48px;

  /* Border radius macOS */
  --mis-radius-sm:   6px;
  --mis-radius-md:   10px;    /* Cards, paneles */
  --mis-radius-lg:   14px;    /* Modales, sidebars */
  --mis-radius-xl:   20px;    /* Elementos grandes */
  --mis-radius-full: 9999px;  /* Chips, badges */

  /* Sombras muy sutiles (estilo macOS) */
  --mis-shadow-sm:    0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --mis-shadow-md:    0 4px 16px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  --mis-shadow-lg:    0 8px 32px rgba(0,0,0,0.10), 0 4px 8px rgba(0,0,0,0.06);
  --mis-shadow-focus: 0 0 0 3px rgba(66, 173, 224, 0.35);  /* Foco — secundario #42ADE0 */
}
```

### 9.4 Layout Responsive del Shell (Tailwind v4)

```html
<!-- shell-layout.component.html -->
<div class="flex h-screen overflow-hidden bg-[var(--mis-bg)]">

  <!-- Col 1: Tira de íconos (~56px) -->
  <nav class="w-14 shrink-0 flex flex-col items-center py-3 gap-1
              bg-[var(--mis-sidebar-bg)] border-r border-[var(--mis-border)]
              max-md:hidden">
    <app-sidebar />
  </nav>

  <!-- Col 2: Panel de navegación (~256px) — persistente -->
  <aside class="w-64 shrink-0 flex flex-col
                bg-[var(--mis-panel-bg)] border-r border-[var(--mis-border)]
                overflow-y-auto
                max-lg:hidden">
    <app-sidebar-nav-panel />
  </aside>

  <!-- Zona principal: Header + Contenido -->
  <div class="flex flex-col flex-1 min-w-0 overflow-hidden">

    <!-- Header con efecto vidrio macOS -->
    <header class="h-12 shrink-0 flex items-center px-4
                   bg-[var(--mis-surface)]/80 backdrop-blur-md
                   border-b border-[var(--mis-border)]">
      <app-header />
    </header>

    <main class="flex-1 overflow-auto p-6">
      <router-outlet />
    </main>

  </div>
</div>
```

**Breakpoints responsive:**

| Breakpoint | Col 1 (Íconos) | Col 2 (Panel) | Comportamiento |
|---|---|---|---|
| `< md` (< 768px) | Oculta | Oculta | Hamburger menu → drawer overlay |
| `md` – `lg` (768–1279px) | Visible | Oculta | Click en ícono abre Col 2 como overlay |
| `>= xl` (≥ 1280px) | Visible | Visible | Layout completo de 3 columnas |

### 9.5 Reglas de Uso de PrimeNG con Tailwind

| Regla | Descripción |
|---|---|
| **PG-01** | Importar solo los componentes PrimeNG necesarios (tree-shakeable). **No** importar `PrimeNGModule` global. |
| **PG-02** | El preset `MisTheme` sobreescribe los tokens de PrimeNG para alinearse con la paleta macOS (`--mis-accent`, `--mis-surface`, etc.). |
| **PG-03** | `ripple: false` en `providePrimeNG` — el efecto ripple no corresponde al estilo macOS. |
| **PG-04** | Usar **Tailwind v4** para layout, spacing y responsive. Usar **PrimeNG** para componentes complejos (Table, Dialog, Menu, Toast, Calendar, etc.). No duplicar responsabilidades. |
| **PG-05** | Los estilos de PrimeNG van en el `cssLayer` con orden: `tailwind-base → primeng → tailwind-utilities`. Esto permite que Tailwind sobrescriba estilos de PrimeNG cuando sea necesario. |
| **PG-06** | Los Remotes (micro-frontends) también instalan PrimeNG y usan **el mismo preset** `MisTheme`. El preset se comparte automáticamente via `shareAll` de Native Federation (singleton). |
| **PG-07** | Los íconos del sidebar (Col 1) usan **PrimeIcons** (`pi pi-home`, `pi pi-chart-line`, etc.); las vistas del Host usan **ng-icons/Lucide** (SVG stroke) para el resto de iconografía. |
| **PG-08** | El breadcrumb de navegación es **`p-breadcrumb`** y vive únicamente en el header del layout (regla HD-01 del doc 02). Ninguna vista implementa breadcrumbs propios. |
| **PG-09** | La mensajería efímera es **`p-toast`** global (root) alimentado por `MessageService` a través de la fachada `ToastService` — no se crean componentes de toast propios. |
| **PG-10** | Toda vista de gestión se encapsula en **`p-card`** con `pTemplate="header"` (título + acción) y body, usando la clase global `.mis-card` (styles.css). |
