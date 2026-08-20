import { Routes } from '@angular/router';

/** Rutas de "Framework ESG" — un solo componente (`PrincipalComponent`), montado bajo `/app/esg` (ver `app.routes.ts`). */
export const FRAMEWORK_ESG_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/principal/principal.component').then((m) => m.PrincipalComponent),
  },
];
