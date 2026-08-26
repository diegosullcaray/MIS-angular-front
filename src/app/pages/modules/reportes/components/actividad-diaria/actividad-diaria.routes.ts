import { Routes } from '@angular/router';
import { CLIENTES_ROUTES } from './components/Clientes/clientes.routes';
import { CARTERA_ROUTES } from './components/Cartera/cartera.routes';
import { PORTAFOLIO_REASIGNADO_ROUTES } from './components/Portafolio Reasignado/portafolio-reasignado.routes';
import { CAPTACIONES_ROUTES } from './components/Captaciones/captaciones.routes';
import { CARTERA_EN_MORA_ROUTES } from './components/Cartera en Mora/cartera-en-mora.routes';
/** Rutas de "Actividad Diaria" — separadas de `reportes.routes.ts` por la misma razón que `analista.routes.ts`. */
export const ACTIVIDAD_DIARIA_ROUTES: Routes = [
   ...CAPTACIONES_ROUTES,
   ...CLIENTES_ROUTES,
   ...CARTERA_ROUTES,
   ...CARTERA_EN_MORA_ROUTES,
   ...PORTAFOLIO_REASIGNADO_ROUTES
];
