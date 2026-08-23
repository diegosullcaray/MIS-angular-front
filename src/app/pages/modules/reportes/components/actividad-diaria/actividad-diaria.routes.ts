import { Routes } from '@angular/router';
import { CAPTACIONES_ROUTES } from './components/captaciones/captaciones.routes';

/** Rutas de "Actividad Diaria" — separadas de `reportes.routes.ts` por la misma razón que `analista.routes.ts`. */
export const ACTIVIDAD_DIARIA_ROUTES: Routes = [
   ...CAPTACIONES_ROUTES
];
