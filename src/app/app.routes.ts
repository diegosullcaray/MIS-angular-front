import { Routes } from '@angular/router';
import { ShellLayoutComponent } from './pages/full-pages/layout/components/shell-layout/shell-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const APP_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'inicio/dashboard'
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/full-pages/auth/components/login/login.component').then(
        (m) => m.LoginComponent
      )
  },
  {
    path: 'inicio',
    component: ShellLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'inicio'
      },
      {
        path: 'inicio',
        loadChildren: () =>
          import('./pages/modules/inicio/inicio.routes').then(
            (m) => m.INICIO_ROUTES
          )
      },
      {
        path: 'admin',
        canActivate: [roleGuard('admin-sistema')], // Exclusivo admin-sistema
        loadChildren: () =>
          import('./pages/modules/admin/admin.routes').then(
            (m) => m.ADMIN_ROUTES
          )
      },


      {
        // Ruta componentless + comodín: soporta URLs profundas del remote
        // (/admin/:remoteName/lo-que-sea). Al no tener component, el hijo '**'
        // hereda el parámetro :remoteName (paramsInheritanceStrategy 'emptyOnly').
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



