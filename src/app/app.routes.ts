import { Routes } from '@angular/router';
import { ShellLayoutComponent } from './pages/full-pages/layout/components/shell-layout/shell-layout.component';
import { authGuard } from './core/guards/auth.guard';

export const APP_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'app/dashboard'
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
    // 'app' — igual que el sistema legado STG (AdminLayoutComponent montado
    // en `path: 'app'`, ver app-routing.module.ts), no 'admin'.
    path: 'app',
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
        // 'ranking-k' — debe coincidir exactamente con el segmento que usaba
        // el sistema legado STG (app/ranking-k, ver app-routing.module.ts) y
        // con el `act_sec` que devuelve list_sec para este ítem del menú.
        path: 'ranking-k',
        loadChildren: () =>
          import('./pages/modules/ranking-k/ranking-k.routes').then(
            (m) => m.RANKING_K_ROUTES
          )
      },
      {
        path: 'Kaypacha__',
        loadChildren: () =>
          import('./pages/modules/kaypacha/kaypacha.routes').then(
            (m) => m.KAYPACHA_ROUTES
          )
      },
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
