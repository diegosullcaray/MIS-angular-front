import { Routes } from '@angular/router';
import { ShellLayoutComponent } from './pages/full-pages/layout/components/shell-layout/shell-layout.component';
import { authGuard } from './core/guards/auth.guard';

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
        path: 'kaypacha',
        loadChildren: () =>
          import('./pages/modules/kaypacha/kaypacha.routes').then(
            (m) => m.KAYPACHA_ROUTES
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
