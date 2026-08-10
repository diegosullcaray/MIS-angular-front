import { Routes } from '@angular/router';

/**
 * Rutas de "Incentivos" — un solo componente (`PrincipalComponent`),
 * montado bajo `/app/incentivos3` (ver `app.routes.ts`). El legado STG
 * tenía además rutas hijas `calculadora`/`detalle`/`detalle-2` para la
 * variante mobile de los diálogos (`Incentivos3RoutingModule`) — no se
 * migran: los diálogos de esta migración ya son responsive
 * (`CalculadoraDialogComponent`/`DetalleVariableDialogComponent`/
 * `DetalleBancarizacionDialogComponent`, todos `p-dialog`), igual criterio
 * que en ESG/Dashboard.
 */
export const INCENTIVOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/principal/principal.component').then((m) => m.PrincipalComponent),
  },
];
