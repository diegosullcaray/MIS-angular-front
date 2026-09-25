import { Routes } from '@angular/router';

/**
 * Rutas de "Actividad Mensual → Portafolio Reasignado". El `path` de cada una es el del legado; las
 * dos salen del host `cra-v11` y comparten componente: `data.reporte` elige el `cod_rep`.
 */
export const PORTAFOLIO_REASIGNADO_ROUTES: Routes = [
  {
    /** Legado `gest_cart_her` de rma (`RS_AGE_COM_CRM`): "Gestión de Cartera Reasignada Mes". */
    path: 'leg/com/rma/adm/gest_cart_her',
    data: { reporte: 'RS_AGE_COM_CRM' },
    loadComponent: () =>
      import('./items/gestion-cartera-reasignada/gestion-cartera-reasignada.component').then(
        (c) => c.GestionCarteraReasignadaComponent,
      ),
  },
  {
    /** Legado `gest_cart_her-flujo` (`RS_AGE_COM_CRM_F`). */
    path: 'leg/com/rma/adm/gest_cart_her-flujo',
    data: { reporte: 'RS_AGE_COM_CRM_F' },
    loadComponent: () =>
      import('./items/gestion-cartera-reasignada/gestion-cartera-reasignada.component').then(
        (c) => c.GestionCarteraReasignadaComponent,
      ),
  },
];
