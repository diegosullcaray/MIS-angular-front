import { Routes } from '@angular/router';

/** Rutas de "Incentivos" — un solo componente (`PrincipalComponent`), montado bajo `/app/incentivos3` (ver `app.routes.ts`). */
export const INCENTIVOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/principal/principal.component').then((m) => m.PrincipalComponent),
  },
];
