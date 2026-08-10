import { Routes } from '@angular/router';

/**
 * Rutas de "Dashboard" (Dashboards Integrados) — mismos 2 segmentos que
 * usaba el módulo legado STG `reportes-e` (`docs/07-modulos/app-routing.module.ts`),
 * montado bajo `/app/dashboards` (ver `app.routes.ts`). No incluye la ruta
 * `usuarios` del legado (variante enrutada para mobile del diálogo de
 * usuarios) — ese diálogo ya es responsive (`UsuariosReporteDialogComponent`,
 * `p-dialog`), igual que en ESG.
 */
export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/principal/principal.component').then((m) => m.PrincipalComponent),
  },
  {
    path: 'power-bi',
    loadComponent: () =>
      import('./components/power-bi/power-bi.component').then((m) => m.PowerBiComponent),
  },
];
