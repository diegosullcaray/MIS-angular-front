import { Routes } from '@angular/router';

export const USUARIOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/usuarios-list/usuarios-list.component').then(
        (m) => m.UsuariosListComponent
      )
  },
  {
    path: 'nuevo',
    loadComponent: () =>
      import('./components/usuario-form/usuario-form.component').then(
        (m) => m.UsuarioFormComponent
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/usuario-form/usuario-form.component').then(
        (m) => m.UsuarioFormComponent
      )
  }
];
