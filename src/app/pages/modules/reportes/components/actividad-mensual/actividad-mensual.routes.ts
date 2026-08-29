import { Routes } from '@angular/router';
import { APLICATIVO_MOVIL_ROUTES } from './components/Aplicativo Movil/aplicativo-movil.routes';
import { TABLERO_DIGITAL_ROUTES } from './components/Tablero Digital/tablero-digital.routes';
import { HUELLA_CARBONO_ROUTES } from './components/Huella Carbono/huella-carbono.routes';
import { PORTAFOLIO_REASIGNADO_ROUTES } from './components/Portafolio Reasignado/portafolio-reasignado.routes';
import { CAPTACIONES_ROUTES } from './components/Captaciones/captaciones.routes';
import { CARTERA_ROUTES } from './components/Cartera/cartera.routes';
import { CARTERA_EN_MORA_ROUTES } from './components/Cartera en Mora/cartera-en-mora.routes';
import { CLIENTES_ROUTES } from './components/Clientes/clientes.routes';
import { RENTABILIDAD_ROUTES } from './components/Rentabilidad/rentabilidad.routes';
import { RANKING_KAYPACHA_ROUTES } from './components/Ranking Kaypacha/ranking-kaypacha.routes';

/** Rutas de "Actividad Mensual" — combinando los 10 sub-módulos migrados. */
export const ACTIVIDAD_MENSUAL_ROUTES: Routes = [
  ...APLICATIVO_MOVIL_ROUTES,
  ...TABLERO_DIGITAL_ROUTES,
  ...HUELLA_CARBONO_ROUTES,
  ...PORTAFOLIO_REASIGNADO_ROUTES,
  ...CAPTACIONES_ROUTES,
  ...CARTERA_ROUTES,
  ...CARTERA_EN_MORA_ROUTES,
  ...CLIENTES_ROUTES,
  ...RENTABILIDAD_ROUTES,
  ...RANKING_KAYPACHA_ROUTES,
];
