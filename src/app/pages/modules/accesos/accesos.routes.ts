import { Routes } from '@angular/router';

export const ACCESOS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/accesos-shell/accesos-shell.component').then(
        (m) => m.AccesosShellComponent
      )
  },
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./components/usuarios/usuarios-list/usuarios-list.component').then(
        (m) => m.UsuariosListComponent
      )
  },
  {
    path: 'usuarios/nuevo',
    loadComponent: () =>
      import('./components/usuarios/usuario-form/usuario-form.component').then(
        (m) => m.UsuarioFormComponent
      )
  },
  {
    path: 'usuarios/:id',
    loadComponent: () =>
      import('./components/usuarios/usuario-form/usuario-form.component').then(
        (m) => m.UsuarioFormComponent
      )
  },
  {
    path: 'roles',
    loadComponent: () =>
      import('./components/roles/roles-list/roles-list.component').then(
        (m) => m.RolesListComponent
      )
  },
  {
    path: 'roles/nuevo',
    loadComponent: () =>
      import('./components/roles/rol-form/rol-form.component').then(
        (m) => m.RolFormComponent
      )
  },
  {
    path: 'roles/:id',
    loadComponent: () =>
      import('./components/roles/rol-form/rol-form.component').then(
        (m) => m.RolFormComponent
      )
  }
];
