import { Routes } from '@angular/router';

export const ACTIVIDAD_COMERCIAL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/principal/principal.component').then((m) => m.PrincipalComponent),
  },
];
