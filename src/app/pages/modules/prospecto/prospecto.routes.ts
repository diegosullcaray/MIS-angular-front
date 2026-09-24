import { Routes } from '@angular/router';

export const PROSPECTO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/principal/principal.component').then((m) => m.PrincipalComponent),
  },
];
