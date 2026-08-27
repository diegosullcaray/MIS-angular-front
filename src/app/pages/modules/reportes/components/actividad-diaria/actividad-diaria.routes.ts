import { Routes } from '@angular/router';
import { CLIENTES_ROUTES } from './components/Clientes/clientes.routes';
import { CARTERA_ROUTES } from './components/Cartera/cartera.routes';
import { PORTAFOLIO_REASIGNADO_ROUTES } from './components/Portafolio Reasignado/portafolio-reasignado.routes';
import { CAPTACIONES_ROUTES } from './components/Captaciones/captaciones.routes';
import { CARTERA_EN_MORA_ROUTES } from './components/Cartera en Mora/cartera-en-mora.routes';
import { COMERCIAL_EJECUTIVO_ROUTES } from './components/Comercial Ejecutivo/comercial-ejecutivo.routes';
import { REPORTES_PDM_ROUTES } from './components/Reportes PDM/reportes-pdm.routes';
import { PROYECCIONES_ROUTES } from './components/Proyecciones/proyecciones.routes';
import { CAMPANAS_ROUTES } from './components/Campañas/campanas.routes';
import { SEGUROS_ROUTES } from './components/Seguros/seguros.routes';
/** Rutas de "Actividad Diaria" — separadas de `reportes.routes.ts` por la misma razón que `analista.routes.ts`. */
export const ACTIVIDAD_DIARIA_ROUTES: Routes = [
   ...CAPTACIONES_ROUTES,
   ...CLIENTES_ROUTES,
   ...CARTERA_ROUTES,
   ...CARTERA_EN_MORA_ROUTES,
   ...PORTAFOLIO_REASIGNADO_ROUTES,
   ...SEGUROS_ROUTES,
   ...CAMPANAS_ROUTES,
   ...COMERCIAL_EJECUTIVO_ROUTES,
   ...PROYECCIONES_ROUTES,
   ...REPORTES_PDM_ROUTES,
];
