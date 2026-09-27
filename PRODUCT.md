# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Asesores y ejecutivos comerciales de Financiera Confianza como usuario principal (consultan su propio desempeño, comisiones y ranking en el día a día). Analistas y gerentes de agencia/riesgo son audiencia secundaria confirmada, usando módulos de reporting y consulta para gestión y supervisión.

## Product Purpose

MIS Host modernza la experiencia de un conjunto de herramientas internas legado (sistemas STG dispersos) sin ampliar su alcance funcional: mismo conjunto de capacidades que antes, entregado con una arquitectura y UI modernas (Angular 22 zoneless, PrimeNG 21, Tailwind v4) sobre el mismo backend Ant/Winder.

## Positioning

Consolidación 1:1 de herramientas legado dispersas en un único frontend Angular, sin reinventar el alcance de negocio ni los contratos del backend que ya funcionan.

## Operating Context

Uso interno en Financiera Confianza. Módulos actuales: actividades, categorización, consulta-fen, dashboard, framework-esg, herramientas, home, incentivos, kaypacha, ranking-k, reportes. Backend Ant consumido vía transporte Winder (`core/winder/instances/Mod*Service`); OAuth, Winder, strands, códigos, parámetros y semántica de vacíos están congelados durante esta consolidación (ver AGENTS.md).

## Capabilities and Constraints

- Angular 22 zoneless: sin zone.js, señales (`signal()`/`computed()`/`input()`/`output()`) en vez de `@Input()`/`@Output()`/RxJS para estado síncrono, `standalone: true`, `inject()`, control de flujo `@if`/`@for`/`@switch`.
- Tokens CSS nativos en `src/app/theme/tokens.css` son la única fuente de verdad de estilo; prohibido inventar clases semánticas (ej. `bg-surface-card`) — todo pasa por `var(--mis-*)`.
- Cuatro estados obligatorios en este orden: error, cargando, vacío, contenido, usando `src/app/shared/ui/` (`app-inline-error`, `app-empty-state`, `app-list-skeleton`, `app-data-table`).
- Preferencia de diseño previa registrada: mobile-first, animaciones rápidas, pestañas lineales, spinner global solo en la primera carga de cada pantalla.
- No hay requisito de accesibilidad formal documentado (sin WCAG obligatorio ni restricción de conectividad/dispositivo conocida) — se sigue buena práctica general (contraste, foco de teclado) sin norma exigida.

## Brand Commitments

Marca Financiera Confianza (assets en `src/assets/images/fc/`: logos, avatares, fondos, íconos por módulo). Paleta y tokens actuales viven en `src/app/theme/tokens.css` / `tokens.paleta.ts` — evidencia incumbente, no decisión de marca cerrada para un rediseño.

## Evidence on Hand

- `governance/docs/` documenta convenciones, contratos de datos, inventario de módulos y estándar de reportes.
- `src/app/shared/ui/` ya contiene componentes de ventana tipo macOS embrionarios (`app-window-panel`: semáforo, título centrado, botón de refrescar en la esquina), usados por Kaypacha y otros módulos.
- Sin credenciales, identidades reales ni tokens reales en código o fixtures (regla explícita del README).

## Product Principles

1. Preservar el alcance funcional y los contratos de backend (Ant/Winder) congelados; el rediseño es de superficie, no de comportamiento.
2. Todo estilo pasa por tokens CSS nativos — nunca clases semánticas inventadas.
3. Los cuatro estados (error/cargando/vacío/contenido) y el patrón de spinner global/skeleton no cambian con el rediseño visual.
4. Mobile-first y velocidad de interacción priorizados sobre ornamentación.

## Accessibility & Inclusion

Sin requisito formal documentado. Mantener buena práctica general (contraste, navegación por teclado) como piso mínimo.
