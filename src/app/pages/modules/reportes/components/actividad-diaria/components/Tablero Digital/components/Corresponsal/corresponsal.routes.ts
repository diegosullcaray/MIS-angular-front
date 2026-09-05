import { Routes } from '@angular/router';

/** Rutas de "Tablero Digital → Corresponsal". El `path` de cada una es el del legado. */
export const TABLERO_CORRESPONSAL_ROUTES: Routes = [
  {
    /** Legado `v-general-cor` (`RVIUWGCOR_01`, jerarquía `OFI_1`). */
    path: 'leg/com/rda/adm/v-general-cor',
    loadComponent: () =>
      import('./items/vista-general-corresponsal/vista-general-corresponsal.component').then(
        (c) => c.VistaGeneralCorresponsalComponent,
      ),
  },
  {
    /** Legado `v-gestion-cor` (`RVIUWGCORE_02`, jerarquía `OFI_1`). */
    path: 'leg/com/rda/adm/v-gestion-cor',
    loadComponent: () =>
      import('./items/gestion-corresponsal/gestion-corresponsal.component').then((c) => c.GestionCorresponsalComponent),
  },
  {
    /** Legado `det_correspon` (`RDETCORR_01`, host paginado `cra-V10`, jerarquía `OFI_1`). */
    path: 'leg/com/rda/adm/det_correspon',
    loadComponent: () =>
      import('./items/detalle-corresponsales/detalle-corresponsales.component').then(
        (c) => c.DetalleCorresponsalesComponent,
      ),
  },
];
