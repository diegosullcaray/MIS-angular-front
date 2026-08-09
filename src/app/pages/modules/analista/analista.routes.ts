import { Routes } from '@angular/router';

export const ANALISTA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/principal/principal.component').then((m) => m.PrincipalComponent),
  },
  {
    path: 'listas',
    loadComponent: () => import('./components/listas/listas.component').then((m) => m.ListasComponent),
  },
  {
    path: 'listas/priorizacion-leads',
    loadComponent: () =>
      import('./components/priorizacion-leads/priorizacion-leads.component').then(
        (m) => m.PriorizacionLeadsComponent
      ),
  },
  {
    path: 'listas/becas',
    loadComponent: () => import('./components/becas/becas.component').then((m) => m.BecasComponent),
  },
];
