# 00 — Visión de producto: el MIS Host es un router de sistemas

> **Documentacion:** [Indice](../README.md) | [01 PRD](./01-prd.md) | [02 UX/App Flow](./02-ux-app-flow.md) | [03 TRD](./03-trd.md)

> Este documento es la entrada al canon: la frase que hay que poder repetir de memoria
> antes de leer el PRD, el flujo de UX o el TRD. No introduce requisitos nuevos — es la
> síntesis de lo que el PRD §2, el TRD §5.1/§9 y el UX-flow §5/§6 ya dicen, puesto en un
> solo lugar para que no se diluya entre secciones.

## La frase

> **El MIS Host no es "una aplicación más" del portafolio: es el router que decide qué
> sistema (microfrontend) ve el usuario, con una capa de interacción inspirada en macOS —
> minimalista, espaciosa, sin ruido visual.**

Dos ideas, no una. Si solo se construye la primera (el router técnico) sin la segunda (la
usabilidad), el Host es un `<router-outlet>` con Native Federation y nada más — funciona,
pero se siente como cualquier portal corporativo genérico. La segunda sin la primera no
tiene sentido: no hay nada que enrutar.

## Pilar 1 — Router de sistemas (microfrontends)

El Host no contiene lógica de negocio de ningún subsistema. Su única responsabilidad
funcional es: autenticar, decidir (vía IAM) a qué sistemas tiene acceso el usuario, y
**cargar ese sistema en tiempo de ejecución** sin recargar el navegador.

| El Host sí | El Host no |
|---|---|
| Enruta a Remotes vía Native Federation (`loadRemoteModule`, RN-04) | No usa `iframe` bajo ninguna circunstancia |
| Posee el shell (sidebar, header, breadcrumb, sesión) — RN-01 | No conoce las pantallas internas de un Remote |
| Publica un contrato de solo lectura (`ShellStateService.asReadonly()`) — RN-03 | No comparte estado mutable ni servicios de negocio con los Remotes |
| Administra IAM y el registro de sistemas (qué Remote existe, qué rol lo ve) | No implementa reportería, incentivos, RRHH, etc. — eso vive en cada Remote |
| Muestra skeleton/error por Remote sin romper la shell (CA-04, CA-05) | No bloquea la navegación del resto del Host si un Remote cae |

Esto es, en el fondo, la misma lección que dejó la auditoría del sistema anterior (ver
[`../06-legado-sistema-anterior/01-analisis/01-arquitectura.md §6`](../06-legado-sistema-anterior/01-analisis/01-arquitectura.md#6-el-patrón-de-ui-configuración-declarativa)):
un menú dirigido por datos ya era "medio sistema dinámico" — el Host completa la otra
mitad enrutando también las pantallas, no solo el menú, y lo hace por federación en
tiempo de ejecución en vez de por despliegue monolítico.

## Pilar 2 — Usabilidad "mac"

No es una preferencia estética suelta: es una regla de producto con las mismas
implicaciones que una regla de negocio. Se traduce en decisiones concretas ya fijadas en
el TRD §9 y el UX-flow §4-§6:

| Principio macOS | Cómo se ve en el Host |
|---|---|
| **Poco cromo, mucho contenido** | Header de 44px con efecto vidrio (`backdrop-blur`), sidebar de íconos de 56px — nunca un header de 3 filas ni un sidebar de texto ancho |
| **Un solo punto de orientación** | Breadcrumb único en el header (`p-breadcrumb`, regla HD-01); ninguna vista dibuja su propio título ni un enlace "Volver" |
| **Paneles, no páginas sueltas** | Toda vista de gestión vive en una `p-card` a ancho completo (header + body), nunca suelta en el viewport |
| **Segmentación sin saturar** | `p-selectButton` para subdividir formularios/detalles en pestañas (Información / Estructura / Permisos), en vez de acordeones o wizards de varios pasos |
| **Sombras casi imperceptibles, radios generosos** | Tokens `--mis-shadow-sm/md/lg` (sombras de 1-2% de opacidad) y `--mis-radius-md/lg` (10-14px) — nunca bordes duros de 1px negro |
| **Mensajería efímera, no modal intrusiva** | `p-toast` con auto-cierre; solo las confirmaciones destructivas usan `p-dialog` |
| **Densidad de información controlada** | Escala tipográfica de 11px a 28px (TRD §9.2); nunca un solo tamaño de fuente para todo |

## Cómo se construye: Angular + PrimeNG, elemento por elemento

Esta tabla es el punto de entrada rápido a "qué se usa para qué" — el detalle completo de
cada fila vive en el TRD.

| Necesidad de producto | Elemento de Angular | Elemento de PrimeNG / Tailwind |
|---|---|---|
| Enrutar a un Remote sin reload | `@angular-architects/native-federation` (`loadRemoteModule`), componente standalone `RemoteWrapperComponent` | — |
| Reactividad sin `zone.js` | `provideZonelessChangeDetection()`, `signal()` / `computed()` / `effect()` en todo el Host | — |
| Contrato Host → Remote de solo lectura | Signals con `.asReadonly()` en `ShellStateService` | — |
| Formularios (usuarios, roles, sistemas) | Signal Forms (`@angular/forms/signals`, `form()`, `[formField]`) — **no** `ReactiveFormsModule` | Controles nativos de HTML + `p-selectButton` para pestañas |
| Navegación / orientación | `Router` + `RouterLink` con binding de inputs | `p-breadcrumb` en el header |
| Listados de datos | Componentes standalone con `input()`/`computed()` | `p-table` |
| Confirmaciones destructivas | — | `p-dialog` inline en la lista |
| Notificaciones efímeras | `ToastService` (fachada sobre `MessageService`) | `p-toast` global en el root |
| Tema visual macOS | Preset PrimeNG personalizado (`mis-theme.ts`) | CSS custom properties (`tokens.css`) + Tailwind v4 (`@import "tailwindcss"`) para layout/spacing |
| Iconografía | `@ng-icons/lucide` (vistas del Host) | `primeicons` (sidebar y botones PrimeNG) |

Para el detalle técnico completo (versiones, configuración de `app.config.ts`,
convenciones de carpetas, reglas PG-01..PG-10 de uso de PrimeNG) ver el
[TRD](./03-trd.md). Para el mapa de rutas y el árbol de componentes, ver el
[UX/App Flow](./02-ux-app-flow.md). Para requisitos de negocio y criterios de aceptación,
ver el [PRD](./01-prd.md).
