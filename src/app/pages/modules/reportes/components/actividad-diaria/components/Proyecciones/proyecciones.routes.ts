import { Routes } from '@angular/router';

/** Rutas de "Actividad Diaria → Proyecciones". El `path` de cada una es el del legado. */
export const PROYECCIONES_ROUTES: Routes = [
  {
    /** Legado `proy_M1` (`PROYEC_COLREC`, bloques `_01` y `_03`, strand deprecado). */
    path: 'leg/com/rda/adm/proy_M1',
    loadComponent: () =>
      import('./items/proyeccion-colocacion/proyeccion-colocacion.component').then((c) => c.ProyeccionColocacionComponent),
  },
  {
    /** Legado `proy_M2` (`PROYEC_DIACOLREC`, bloques `_01` y `_02`). */
    path: 'leg/com/rda/adm/proy_M2',
    loadComponent: () =>
      import('./items/proyeccion-diaria-colocacion/proyeccion-diaria-colocacion.component').then(
        (c) => c.ProyeccionDiariaColocacionComponent,
      ),
  },
];
