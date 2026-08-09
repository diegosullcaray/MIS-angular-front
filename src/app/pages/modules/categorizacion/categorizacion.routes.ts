import { Routes } from '@angular/router';

export const CATEGORIZACION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/categorizacion-dashboard/categorizacion-dashboard.component').then(
        (m) => m.CategorizacionDashboardComponent
      ),
  },
];
