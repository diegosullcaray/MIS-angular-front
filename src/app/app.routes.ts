import { Routes } from '@angular/router';
import { ShellLayoutComponent } from './pages/full-pages/layout/components/shell-layout/shell-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const APP_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'admin/dashboard'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/full-pages/auth/components/login/login.component').then(
        (m) => m.LoginComponent
      )
  },
  {
    // Página de error HTTP genérica — ver httpErrorInterceptor (core/interceptors).
    path: 'error/:code',
    loadComponent: () =>
      import('./pages/full-pages/error/components/error-page/error-page.component').then(
        (m) => m.ErrorPageComponent
      )
  },
  {
    path: 'admin',
    component: ShellLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/modules/home/home.routes').then(
            (m) => m.HOME_ROUTES
          )
      },
      {
        path: 'usuarios',
        canActivate: [roleGuard('admin-sistema')], // Exclusivo admin-sistema
        loadChildren: () =>
          import('./pages/modules/admin/usuarios/usuarios.routes').then(
            (m) => m.USUARIOS_ROUTES
          )
      },
      {
        path: 'roles',
        canActivate: [roleGuard('admin-sistema')], // Exclusivo admin-sistema
        loadChildren: () =>
          import('./pages/modules/admin/roles/roles.routes').then(
            (m) => m.ROLES_ROUTES
          )
      },
      {
        path: 'sistemas',
        canActivate: [roleGuard('admin-sistema')], // Exclusivo admin-sistema
        loadChildren: () =>
          import('./pages/modules/admin/sistemas/sistemas.routes').then(
            (m) => m.SISTEMAS_ROUTES
          )
      },
      {
        // Ayuda: disponible para cualquier usuario autenticado, sin roleGuard.
        path: 'help',
        loadChildren: () =>
          import('./pages/modules/help/help.routes').then(
            (m) => m.HELP_ROUTES
          )
      },
      {
        path: ':remoteName',
        children: [
          {
            path: '**',
            loadComponent: () =>
              import('./core/federation/remote-wrapper/remote-wrapper.component').then(
                (m) => m.RemoteWrapperComponent
              )
          }
        ]
      }
    ]
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/full-pages/error/components/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      )
  }
];
