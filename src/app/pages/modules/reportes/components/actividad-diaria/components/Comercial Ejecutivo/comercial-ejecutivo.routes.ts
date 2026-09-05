import { Routes } from '@angular/router';

/** Rutas de "Actividad Diaria → Comercial Ejecutivo". El `path` de cada una es el del legado. */
export const COMERCIAL_EJECUTIVO_ROUTES: Routes = [
  {
    /** Legado `desem-reacfae` (`DESEMBOLSOS_01`). */
    path: 'leg/com/rda/adm/desem-reacfae',
    loadComponent: () => import('./items/desembolsos/desembolsos.component').then((c) => c.DesembolsosEjecutivoComponent),
  },
  {
    /** Legado `cli` (`Clientes_01`). */
    path: 'leg/com/rda/adm/cli',
    loadComponent: () => import('./items/clientes/clientes.component').then((c) => c.ClientesEjecutivoComponent),
  },
  {
    /** Legado `agro` (`AGRO_01`). */
    path: 'leg/com/rda/adm/agro',
    loadComponent: () => import('./items/agro/agro.component').then((c) => c.AgroEjecutivoComponent),
  },
  {
    /** Legado `pdm` (`PDM_01`). */
    path: 'leg/com/rda/adm/pdm',
    loadComponent: () => import('./items/pdm/pdm.component').then((c) => c.PdmEjecutivoComponent),
  },
];
