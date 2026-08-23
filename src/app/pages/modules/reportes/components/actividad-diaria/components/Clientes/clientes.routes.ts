import { Routes } from '@angular/router';

export const CLIENTES_ROUTES: Routes = [
      // items 
 {
    path: 'leg/com/rda/adm/cli-nue-rec',
    loadComponent: () =>
      import('./items/clientes-nuevos-recurrentes/clientes-nuevos-recurrentes.component')
        .then((c) => c.ClientesNuevosRecurrentesComponent)
  },
   {
    path: 'leg/com/rda/adm/cli-ope',
    loadComponent: () =>
      import('./items/clientes-operaciones/clientes-operaciones.component')
        .then((c) => c.ClientesOperacionesComponent)
  },
   {
    path: 'repositorio/actividad-diaria/clientes/movimiento-clientes',
    loadComponent: () =>
      import('./items/movimiento-clientes/movimiento-clientes.component')
        .then((c) => c.MovimientoClientesComponent)
  },
     {
    path: 'repositorio/actividad-diaria/mujer/mujer',
    loadComponent: () =>
      import('./items/ranking-clientes/ranking-clientes.component')
        .then((c) => c.RankingClientesComponent)
  },

  // components
       {
    path: 'leg/com/rda/adm/cmg_cliente_flujo',
    loadComponent: () =>
      import('./components/CMG Clientes/cmg-clientes-flujo/cmg-clientes-flujo.component')
        .then((c) => c.CmgClientesFlujoComponent)
  },
         {
    path: 'leg/com/rda/adm/cmg-cli',
    loadComponent: () =>
      import('./components/CMG Clientes/cmg-clientes-stock/cmg-clientes-stock.component')
        .then((c) => c.CmgClientesStockComponent)
  },
];