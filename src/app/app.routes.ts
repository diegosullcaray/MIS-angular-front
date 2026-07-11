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
        loadComponent: () =>
          import('./pages/modules/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          )
      },
      {
        path: 'catalogos',
        canActivate: [roleGuard('admin-general')], // admin-general o superior (admin-sistema)
        loadChildren: () =>
          import('./pages/modules/catalogos/catalogos.routes').then(
            (m) => m.CATALOGOS_ROUTES
          )
      },
      {
        path: 'accesos',
        canActivate: [roleGuard('admin-sistema')], // Exclusivo admin-sistema
        loadChildren: () =>
          import('./pages/modules/accesos/accesos.routes').then(
            (m) => m.ACCESOS_ROUTES
          )
      },
      {
        path: ':remoteName',
        loadComponent: () =>
          import('./core/federation/remote-wrapper/remote-wrapper.component').then(
            (m) => m.RemoteWrapperComponent
          )
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


