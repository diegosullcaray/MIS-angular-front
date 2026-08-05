import { Routes } from '@angular/router';

export const KAYPACHA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/kaypacha-dashboard/kaypacha-dashboard.component').then(
        (m) => m.KaypachaDashboardComponent
      ),
  },
];
