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
        path: 'accesos',
        canActivate: [roleGuard('admin-sistema')], // Exclusivo admin-sistema
        loadChildren: () =>
          import('./pages/modules/admin/accesos.routes').then(
            (m) => m.ACCESOS_ROUTES
          )
      },
      {
        path: 'sistemas',
        canActivate: [roleGuard('admin-sistema')], // Exclusivo admin-sistema
        loadChildren: () =>
          import('./pages/modules/admin/sistemas.routes').then(
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
        // Ruta componentless + comodín: soporta URLs profundas del remote
        // (/admin/:remoteName/lo-que-sea). Al no tener component, el hijo '**'
        // hereda el parámetro :remoteName (paramsInheritanceStrategy 'emptyOnly').
        // Debe ir al final: es la única ruta que hace match de cualquier segmento.
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
