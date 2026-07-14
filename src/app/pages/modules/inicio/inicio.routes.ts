import { Routes } from '@angular/router';

export const INICIO_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () =>
            import('./components/inicio/inicio.component').then(
                (m) => m.InicioComponent
            )
    },
    {
        path: 'inicio',
        loadComponent: () =>
            import('./components/inicio/inicio.component').then(
                (m) => m.InicioComponent
            )
    },
];