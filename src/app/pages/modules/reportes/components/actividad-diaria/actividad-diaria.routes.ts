import { Routes } from '@angular/router';
import { CAPTACIONES_ROUTES } from './components/captaciones/captaciones.routes';
import { CLIENTES_ROUTES } from './components/Clientes/clientes.routes';

/** Rutas de "Actividad Diaria" — separadas de `reportes.routes.ts` por la misma razón que `analista.routes.ts`. */
export const ACTIVIDAD_DIARIA_ROUTES: Routes = [
   ...CAPTACIONES_ROUTES,
   ...CLIENTES_ROUTES
];
