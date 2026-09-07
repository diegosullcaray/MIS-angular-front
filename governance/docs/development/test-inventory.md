# Inventario de pruebas

## Evidencia encontrada

- 349 archivos `*.spec.ts` bajo `src/app` para servicios, mapeos, componentes, guards, interceptores, tablas, graficos, preferencias y modulos.
- 29 suites Playwright bajo `e2e/`.
- Dos proyectos E2E: Chromium de escritorio y Chromium movil Pixel 7.
- Las suites mockean backend con `page.route()` e inyectan sesion en `sessionStorage`; no dependen de Google ni de Ant real.
- `src/test-setup.ts` limpia `sessionStorage` antes de cada spec para aislar el cache de jerarquia.

## Cobertura funcional E2E

Login, guards, expiracion, cambio de usuario, shell responsive, breadcrumb, Home recientes, configuracion, comunicados, errores, reportes, jerarquia, cartera, captaciones, clientes, presupuesto, ESG, incentivos y reportes de actividad diaria/mensual.

## Gaps de gobierno

El numero de archivos no equivale a cobertura de negocio. Faltan inventarios automatizados de rutas contra menu, contratos `cod_rep` contra servicios y pruebas de autorizacion real del backend. Las pruebas actuales validan principalmente el comportamiento del frontend aislado.

Tambien debe evitarse afirmar cobertura total por conteo de specs: varias pruebas comparten mocks, y el E2E no valida Google ni Ant reales por diseño.

## Comandos

- Unitarias: `npm test`.
- E2E: `npm run e2e`.
- Build y control de bundle: `npm run build:prod`.
