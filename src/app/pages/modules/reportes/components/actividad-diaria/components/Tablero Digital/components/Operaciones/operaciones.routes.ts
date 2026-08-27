import { Routes } from '@angular/router';

/** Rutas de "Tablero Digital → Operaciones". El `path` de cada una es el del legado. */
export const TABLERO_OPERACIONES_ROUTES: Routes = [
  {
    /** Legado `GC-tab-digital_vr2-ope` (`GCTABDIG_VR2_OPE_02`, jerarquía `MAC_2`). */
    path: 'leg/com/rda/adm/GC-tab-digital_vr2-ope',
    loadComponent: () => import('./items/gestion-canal/gestion-canal.component').then((c) => c.GestionCanalComponent),
  },
  {
    /** Legado `tab-digital_vr2-ope` (`TABDIG_VR2_01`, jerarquía `MAC_2`). */
    path: 'leg/com/rda/adm/tab-digital_vr2-ope',
    loadComponent: () =>
      import('./items/vista-general-canal/vista-general-canal.component').then((c) => c.VistaGeneralCanalComponent),
  },
];
