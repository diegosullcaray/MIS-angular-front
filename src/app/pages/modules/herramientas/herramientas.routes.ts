import { Routes } from '@angular/router';

export const HERRAMIENTAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/herramientas-home/herramientas-home.component').then(
        (m) => m.HerramientasHomeComponent
      ),
  },
];
