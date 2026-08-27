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
import { APLICATIVO_MOVIL_ROUTES } from './components/Aplicativo Movil/aplicativo-movil.routes';
import { TABLERO_DIGITAL_ROUTES } from './components/Tablero Digital/tablero-digital.routes';
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
   ...APLICATIVO_MOVIL_ROUTES,
   ...TABLERO_DIGITAL_ROUTES,
   // "Resumen de Movilidad" no cuelga de ningún sub-nodo del menú: sus dos
   // reportes son items directos de "Actividad Diaria", así que sus rutas van
   // acá y no en un archivo de módulo propio.
   {
     /** Legado `res-mov` (`RESNMOV_01`, host paginado `cra-V10`). */
     path: 'leg/com/rda/adm/res-mov',
     loadComponent: () =>
       import('./items/resumen-movilidad-comercial/resumen-movilidad-comercial.component').then(
         (c) => c.ResumenMovilidadComercialComponent,
       ),
   },
   {
     /** Legado `res-mov-rec` (`RESNMOVR_01`, host `cra-v6`: consulta por el usuario, sin jerarquía). */
     path: 'leg/com/rda/adm/res-mov-rec',
     loadComponent: () =>
       import('./items/resumen-movilidad-recuperaciones/resumen-movilidad-recuperaciones.component').then(
         (c) => c.ResumenMovilidadRecuperacionesComponent,
       ),
   },
];
