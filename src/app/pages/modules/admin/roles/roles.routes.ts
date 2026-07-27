import { Routes } from '@angular/router';

export const ROLES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/roles-list/roles-list.component').then(
        (m) => m.RolesListComponent
      )
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./components/rol-form/rol-form.component').then(
        (m) => m.RolFormComponent
      )
  },
  {
    // Detalle del rol: pestañas Detalle | Sistemas | Usuarios
    path: ':id',
    loadComponent: () =>
      import('./components/rol-detalle/rol-detalle.component').then(
        (m) => m.RolDetalleComponent
      )
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./components/rol-form/rol-form.component').then(
        (m) => m.RolFormComponent
      )
  }
];
