import { Routes } from '@angular/router';

/**
 * Rutas de "Framework ESG" — un solo componente (`PrincipalComponent`),
 * montado bajo `/app/esg` (ver `app.routes.ts`). El legado STG tenía
 * además rutas hijas `usuarios`/`editar` para la variante mobile de los
 * diálogos (`FrameworkEsgRoutingModule`) — no se migran: los diálogos de
 * esta migración ya son responsive (`EditarMetricaDialogComponent`/
 * `UsuariosMetricaDialogComponent`, ambos `p-dialog`).
 */
export const FRAMEWORK_ESG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/principal/principal.component').then((m) => m.PrincipalComponent),
  },
];
