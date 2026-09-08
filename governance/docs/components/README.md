# Componentes

- [Design system](./design-system.md) — tokens y cómo se aplica el color en este proyecto
- [Catálogo de componentes](./component-catalog.md) — contratos de `shared/ui`
- [Accesibilidad y estados de UI](./accessibility.md)
- [Guía de KPI](./kpi-guidelines.md)
- [Modelo de estados](../development/state-model.md) — ownership del estado de datos

La implementación fuente está en `src/app/shared/ui/`, y **cada familia tiene su propio `README.md` junto al código** con el contrato detallado: esos README son la fuente de verdad del componente; estos documentos son el mapa y las reglas.

Los contenedores de reportes que conocen jerarquía o payload viven en el módulo `reportes`, no en `shared/ui/`.

## Storybook

No hay configuración de Storybook versionada. Mientras no la haya, los contratos vivos son los README junto a cada componente y el [catálogo](./component-catalog.md).

Guía operativa para construir pantallas: [`skills/mis-component-styling`](../../skills/mis-component-styling/SKILL.md).
