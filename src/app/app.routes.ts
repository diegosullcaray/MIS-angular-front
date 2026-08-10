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
      {
        // 'actividades' — coincide con el act_sec del backend para el módulo A_MOD_TAR
        path: 'actividades',
        loadChildren: () =>
          import('./pages/modules/actividades/actividades.routes').then(
            (m) => m.ACTIVIDADES_ROUTES
          )
      },
      {
        // 'cons_base_negativa' — debe coincidir exactamente con el segmento
        // que usaba el sistema legado STG (ver docs/07-modulos/app-routing.module.ts,
        // módulo `basenegativa`) y con el `act_sec` real del backend para
        // este ítem del menú. El módulo en sí se llama "herramientas" en el
        // Host (carpeta `pages/modules/herramientas`), pero la nomenclatura
        // de la ruta no cambia.
        path: 'cons_base_negativa',
        loadChildren: () =>
          import('./pages/modules/herramientas/herramientas.routes').then(
            (m) => m.HERRAMIENTAS_ROUTES
          )
      },
      {
        // 'presupuesto' — coincide con el act_sec del backend para el módulo A_MOD_PRES.
        path: 'presupuesto',
        loadChildren: () =>
          import('./pages/modules/presupuesto/presupuesto.routes').then(
            (m) => m.PRESUPUESTO_ROUTES
          )
      },
      {
        // 'analista/categorizacion' — mismo segmento que usaba el legado STG
        // (ver docs/07-modulos/analista/analista-routing.module.ts, ruta hija
        // 'categorizacion' del módulo 'analista'). Solo se migra esta
        // pantalla del módulo "analista" (no listas/prospecto/detalle).
        path: 'analista/categorizacion',
        loadChildren: () =>
          import('./pages/modules/categorizacion/categorizacion.routes').then(
            (m) => m.CATEGORIZACION_ROUTES
          )
      },
      {
        // 'analista' — Principal (dashboard) y Listas (Priorización de
        // Leads, Becas), migrados del módulo 'analista' legado (ver
        // docs/07-modulos/analista/analista-routing.module.ts). No incluye
        // 'prospecto' (excluido, se solapa con actividades/prospectos-corresponsal)
        // ni 'detalle' (código muerto en el legado).
        path: 'analista',
        loadChildren: () =>
          import('./pages/modules/analista/analista.routes').then(
            (m) => m.ANALISTA_ROUTES
          )
      },
      {
        // 'esg' — debe coincidir exactamente con el segmento que usaba el
        // sistema legado STG (app/esg, ver docs/07-modulos/app-routing.module.ts,
        // módulo framework-esg) y con el act_sec real del backend para este
        // ítem del menú. El módulo en sí se llama "framework-esg" en el Host
        // (carpeta pages/modules/framework-esg), igual que en el legado.
        path: 'esg',
        loadChildren: () =>
          import('./pages/modules/framework-esg/framework-esg.routes').then(
            (m) => m.FRAMEWORK_ESG_ROUTES
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
