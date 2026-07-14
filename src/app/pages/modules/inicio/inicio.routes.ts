import { Routes } from '@angular/router';

/** Rutas del módulo Inicio: el dashboard "Mi espacio" del Host. */
export const INICIO_ROUTES: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
    },
    {
        path: 'dashboard',
        loadComponent: () =>
            import('./components/inicio/inicio.component').then(
                (m) => m.InicioComponent
            )
    },
];
