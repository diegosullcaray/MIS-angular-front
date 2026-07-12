import { Routes } from '@angular/router';

export const SISTEMAS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/sistemas-list/sistemas-list.component').then(
        (m) => m.SistemasListComponent
      )
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./components/sistema-form/sistema-form.component').then(
        (m) => m.SistemaFormComponent
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/sistema-detalle/sistema-detalle.component').then(
        (m) => m.SistemaDetalleComponent
      )
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./components/sistema-form/sistema-form.component').then(
        (m) => m.SistemaFormComponent
      )
  }
];
