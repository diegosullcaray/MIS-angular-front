import { Routes } from '@angular/router';
import { ShellLayoutComponent } from './pages/full-pages/layout/components/shell-layout/shell-layout.component';
import { authGuard } from './core/guards/auth.guard';

/** Rutas del Host. Los segmentos bajo `app/` NO son libres: cada uno debe coincidir carácter por carácter con el `act_sec` que devuelve `list_sec` para ese ítem del menú (los mismos que usaba el sistema legado STG). */
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
    /** Destino de `httpErrorInterceptor` para errores fatales. */
    path: 'error/:code',
    loadComponent: () =>
      import('./pages/full-pages/error/components/error-page/error-page.component').then(
        (m) => m.ErrorPageComponent
      )
  },
  {
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
        /** "Mi espacio" — módulo `home`. Distinto de `dashboards` (plural). */
        path: 'dashboard',
        loadChildren: () =>
          import('./pages/modules/home/home.routes').then((m) => m.HOME_ROUTES)
      },
      {
        path: 'ranking-k',
        loadChildren: () =>
          import('./pages/modules/ranking-k/ranking-k.routes').then((m) => m.RANKING_K_ROUTES)
      },
      {
        path: 'Kaypacha__',
        loadChildren: () =>
          import('./pages/modules/kaypacha/kaypacha.routes').then((m) => m.KAYPACHA_ROUTES)
      },
      {
        path: 'actividades',
        loadChildren: () =>
          import('./pages/modules/actividades/actividades.routes').then((m) => m.ACTIVIDADES_ROUTES)
      },
      {
        /** Módulo `herramientas`. */
        path: 'cons_base_negativa',
        loadChildren: () =>
          import('./pages/modules/herramientas/herramientas.routes').then((m) => m.HERRAMIENTAS_ROUTES)
      },
      {
        path: 'presupuesto',
        loadChildren: () =>
          import('./pages/modules/presupuesto/presupuesto.routes').then((m) => m.PRESUPUESTO_ROUTES)
      },
      {
        /** Módulo `categorizacion`. Va antes que `analista`: si no, la ruta `analista` de abajo captura este path y busca `categorizacion` dentro de ANALISTA_ROUTES, donde no existe. */
        path: 'analista/categorizacion',
        loadChildren: () =>
          import('./pages/modules/categorizacion/categorizacion.routes').then((m) => m.CATEGORIZACION_ROUTES)
      },
      {
        /** Solo Principal y Listas; `prospecto` y `detalle` no se migraron. */
        path: 'analista',
        loadChildren: () =>
          import('./pages/modules/analista/analista.routes').then((m) => m.ANALISTA_ROUTES)
      },
      {
        /** Módulo `framework-esg`. */
        path: 'esg',
        loadChildren: () =>
          import('./pages/modules/framework-esg/framework-esg.routes').then((m) => m.FRAMEWORK_ESG_ROUTES)
      },
      {
        /** Módulo `dashboard` (singular). Distinto de `dashboard` (path de `home`). */
        path: 'dashboards',
        loadChildren: () =>
          import('./pages/modules/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES)
      },
      {
        /** Módulo `incentivos`. Solo se migró la generación `incentivos3`. */
        path: 'incentivos3',
        loadChildren: () =>
          import('./pages/modules/incentivos/incentivos.routes').then((m) => m.INCENTIVOS_ROUTES)
      },
      {
        path: 'reportes',
        loadChildren: () =>
          import('./pages/modules/reportes/reportes.routes').then((m) => m.REPORTES_ROUTE)
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
