import { Routes } from '@angular/router';
import { ActividadComercialService } from './services/actividad-comercial.service';

export const ACTIVIDAD_COMERCIAL_ROUTES: Routes = [
  {
    path: '',
    // El estado del tablero vive con la ruta: al salir se descarta (ver conventions: `root` solo con motivo).
    providers: [ActividadComercialService],
    loadComponent: () =>
      import('./components/principal/principal.component').then((m) => m.PrincipalComponent),
  },
];
