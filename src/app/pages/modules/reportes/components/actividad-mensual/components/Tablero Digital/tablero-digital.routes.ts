import { Routes } from '@angular/router';

export const TABLERO_DIGITAL_ROUTES: Routes = [
  {
    path: 'repositorio/actividad-mensual/tab-digital/usa-come-m',
    loadComponent: () =>
      import('./items/tablero-digital-comercial/tablero-digital-comercial.component').then(
        (c) => c.TableroDigitalComercialComponent,
      ),
  },
  {
    // Alias sin `-m` para tolerancia de rutas
    path: 'repositorio/actividad-mensual/tab-digital/usa-come',
    redirectTo: 'repositorio/actividad-mensual/tab-digital/usa-come-m',
  },
];
