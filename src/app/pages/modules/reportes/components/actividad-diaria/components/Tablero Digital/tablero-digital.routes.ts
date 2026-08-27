import { Routes } from '@angular/router';
import { TABLERO_OPERACIONES_ROUTES } from './components/Operaciones/operaciones.routes';
import { TABLERO_CORRESPONSAL_ROUTES } from './components/Corresponsal/corresponsal.routes';

/** Rutas de "Actividad Diaria → Tablero Digital", con sus dos sub-nodos. */
export const TABLERO_DIGITAL_ROUTES: Routes = [
  {
    /** Legado `tab-digital` (`TABDIG_01` y `_02`, host `cra-v1p4`, jerarquía `OFI_1`). */
    path: 'leg/com/rda/adm/tab-digital',
    loadComponent: () =>
      import('./items/app-cliente-home-banking/app-cliente-home-banking.component').then(
        (c) => c.AppClienteHomeBankingComponent,
      ),
  },
  {
    /** Legado `repositorio/usabilidad-comercial-m` (`RS_TAB_COM_01`, motor `table.regular`). */
    path: 'repositorio/actividad-diaria/tab-digital/usa-come',
    loadComponent: () =>
      import('./items/tablero-digital-comercial/tablero-digital-comercial.component').then(
        (c) => c.TableroDigitalComercialComponent,
      ),
  },
  ...TABLERO_OPERACIONES_ROUTES,
  ...TABLERO_CORRESPONSAL_ROUTES,
];
