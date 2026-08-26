import { Routes } from '@angular/router';

/** Rutas de "Actividad Diaria → Reportes PDM". El `path` de cada una es el del legado. */
export const REPORTES_PDM_ROUTES: Routes = [
  {
    /** Legado `seg_pdm` (`SEG_PDM_01`). */
    path: 'leg/com/rda/adm/seg_pdm',
    loadComponent: () => import('./items/seguimiento-pdm/seguimiento-pdm.component').then((c) => c.SeguimientoPdmComponent),
  },
  {
    /** Legado `repositorio/banca-solidaria` (`GRBSOLI_01`, motor `table.regular`). */
    path: 'repositorio/actividad-diaria/cartera/banca-solidaria',
    loadComponent: () => import('./items/banca-solidaria/banca-solidaria.component').then((c) => c.BancaSolidariaComponent),
  },
];
