import { Routes } from '@angular/router';

/**
 * Rutas del módulo Admin (exclusivo `admin-sistema`).
 *
 * Segmentación: 3 componentes de gestión, cada uno con Lista y Detalle.
 *  - Gestión de Sistemas → lista + detalle (Detalle General | Estructura | Roles)
 *  - Gestión de Roles    → lista + detalle (Detalle General | Usuarios)
 *  - Gestión de Usuarios → lista + detalle (Información General | Roles)
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'sistemas'
  },

  // ─── Gestión de Sistemas ──────────────────────────────────────────────────
  {
    path: 'sistemas',
    loadComponent: () =>
      import('./components/gestion-sistemas/sistemas-list/sistemas-list.component').then(
        (m) => m.SistemasListComponent
      )
  },
  {
    path: 'sistemas/nuevo',
    loadComponent: () =>
      import('./components/gestion-sistemas/sistema-form/sistema-form.component').then(
        (m) => m.SistemaFormComponent
      )
  },
  {
    path: 'sistemas/:id',
    loadComponent: () =>
      import('./components/gestion-sistemas/sistema-detalle/sistema-detalle.component').then(
        (m) => m.SistemaDetalleComponent
      )
  },
  {
    path: 'sistemas/:id/editar',
    loadComponent: () =>
      import('./components/gestion-sistemas/sistema-form/sistema-form.component').then(
        (m) => m.SistemaFormComponent
      )
  },

  // ─── Gestión de Roles ─────────────────────────────────────────────────────
  {
    path: 'roles',
    loadComponent: () =>
      import('./components/gestion-roles/roles-list/roles-list.component').then(
        (m) => m.RolesListComponent
      )
  },
  {
    path: 'roles/nuevo',
    loadComponent: () =>
      import('./components/gestion-roles/rol-form/rol-form.component').then(
        (m) => m.RolFormComponent
      )
  },
  {
    path: 'roles/:id',
    loadComponent: () =>
      import('./components/gestion-roles/rol-detalle/rol-detalle.component').then(
        (m) => m.RolDetalleComponent
      )
  },
  {
    path: 'roles/:id/editar',
    loadComponent: () =>
      import('./components/gestion-roles/rol-form/rol-form.component').then(
        (m) => m.RolFormComponent
      )
  },

  // ─── Gestión de Usuarios ──────────────────────────────────────────────────
  {
    path: 'usuarios',
    loadComponent: () =>
      import('./components/gestion-usuarios/usuarios-list/usuarios-list.component').then(
        (m) => m.UsuariosListComponent
      )
  },
  {
    path: 'usuarios/nuevo',
    loadComponent: () =>
      import('./components/gestion-usuarios/usuario-form/usuario-form.component').then(
        (m) => m.UsuarioFormComponent
      )
  },
  {
    path: 'usuarios/:id',
    loadComponent: () =>
      import('./components/gestion-usuarios/usuario-detalle/usuario-detalle.component').then(
        (m) => m.UsuarioDetalleComponent
      )
  },
  {
    path: 'usuarios/:id/editar',
    loadComponent: () =>
      import('./components/gestion-usuarios/usuario-form/usuario-form.component').then(
        (m) => m.UsuarioFormComponent
      )
  }
];
