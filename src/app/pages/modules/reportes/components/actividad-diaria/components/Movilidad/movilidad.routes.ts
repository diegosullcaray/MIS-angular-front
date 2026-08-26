import { Routes } from '@angular/router';

/**
 * Rutas de "Actividad Diaria → Movilidad".
 *
 * En el legado estos dos reportes cuelgan del nodo raíz de Actividad Diaria, sin
 * nodo propio (ver `sintaxis.json`). Se agrupan acá porque comparten dominio y
 * porque dejarlos sueltos obligaría a un módulo por reporte.
 */
export const MOVILIDAD_ROUTES: Routes = [
  {
    /** Legado `res-mov` (`RESNMOV_01`, host paginado `cra-V10`). */
    path: 'leg/com/rda/adm/res-mov',
    loadComponent: () =>
      import('./items/resumen-movilidad-comercial/resumen-movilidad-comercial.component').then(
        (c) => c.ResumenMovilidadComercialComponent,
      ),
  },
  {
    /** Legado `res-mov-rec` (`RESNMOVR_01`, jerarquía `OFI_3`). */
    path: 'leg/com/rda/adm/res-mov-rec',
    loadComponent: () =>
      import('./items/resumen-movilidad-recuperaciones/resumen-movilidad-recuperaciones.component').then(
        (c) => c.ResumenMovilidadRecuperacionesComponent,
      ),
  },
];
