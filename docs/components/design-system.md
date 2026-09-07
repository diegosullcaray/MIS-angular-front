# Design system

La fuente de verdad visual del frontend son los tokens `--mis-*` en `src/app/theme/tokens.css` y el preset de PrimeNG. Consulta tambien [KPI guidelines](./kpi-guidelines.md).

## Reglas

- Usar tokens semanticos, nunca colores fijos para superficies, texto o estados.
- Mantener los contratos de tablas separados: `app-tabla-reporte` y `app-tabla-dinamica`.
- Los componentes compartidos no deben depender de un modulo de negocio.
- Todo componente interactivo debe conservar accesibilidad, estados de carga, vacio y error.

## Catalogo

- [Component catalog](./component-catalog.md)
- [Accessibility and UI states](./accessibility.md)
- [Storybook](./storybook/README.md)
- [Estados compartidos](./states/README.md)
