import { Routes } from '@angular/router';

/**
 * Rutas de los reportes de "Analista" (legado STG `rda/sectorista` +
 * `rda/administracion`) — separadas de `reportes.routes.ts` para que ese
 * archivo no se sature a medida que se migran los ~25 reportes de esta
 * categoría uno por uno. Se agregan acá, no en el módulo `analista/`
 * (dashboard/listas) que ya existía: son reportes del motor "mixto", mismo
 * patrón que el resto de `reportes`.
 */
export const ANALISTA_ROUTES: Routes = [
  {
    path: 'leg/com/rda/sec/cap-ret',
    loadComponent: () => import('./components/encuesta-clientes/encuesta-clientes.component').then((m) => m.EncuestaClientesComponent),
  },
  {
    path: 'leg/com/rda/sec/repro',
    loadComponent: () =>
      import('./components/clientes-reprogramados/clientes-reprogramados.component').then((m) => m.ClientesReprogramadosComponent),
  },
  {
    path: 'leg/com/rda/sec/cli-act',
    loadComponent: () => import('./components/datos-clientes/datos-clientes.component').then((m) => m.DatosClientesComponent),
  },
  {
    path: 'leg/com/rda/sec/cartera',
    loadComponent: () => import('./components/cartera/cartera.component').then((m) => m.CarteraComponent),
  },
  {
    path: 'leg/com/rda/sec/cli-prod',
    loadComponent: () => import('./components/clientes-producto/clientes-producto.component').then((m) => m.ClientesProductoComponent),
  },
  {
    path: 'leg/com/rda/sec/cli-nue-rec',
    loadComponent: () =>
      import('./components/clientes-nuevos-recurrentes/clientes-nuevos-recurrentes.component').then(
        (m) => m.ClientesNuevosRecurrentesComponent,
      ),
  },
  {
    path: 'leg/com/rda/sec/capta',
    loadComponent: () => import('./components/captaciones/captaciones.component').then((m) => m.CaptacionesComponent),
  },
  {
    path: 'leg/com/rda/sec/sec-prosp',
    loadComponent: () =>
      import('./components/prospecto-corresponsal/prospecto-corresponsal.component').then((m) => m.ProspectoCorresponsalComponent),
  },
  {
    path: 'leg/com/rda/sec/seg',
    loadComponent: () => import('./components/seguros/seguros.component').then((m) => m.SegurosComponent),
  },
  {
    path: 'leg/com/rda/sec/mon-desem',
    loadComponent: () =>
      import('./components/monitor-metas-desembolso/monitor-metas-desembolso.component').then((m) => m.MonitorMetasDesembolsoAnalistaComponent),
  },
  {
    path: 'leg/com/rda/sec/rec-prev',
    loadComponent: () =>
      import('./components/recuperacion-preventiva/recuperacion-preventiva.component').then((m) => m.RecuperacionPreventivaComponent),
  },
  {
    path: 'leg/com/rda/sec/zu-cuo',
    loadComponent: () => import('./components/cero-cuotas/cero-cuotas.component').then((m) => m.CeroCuotasComponent),
  },
  {
    path: 'leg/com/rda/sec/pdm',
    loadComponent: () => import('./components/grupos-por-vencer/grupos-por-vencer.component').then((m) => m.GruposPorVencerComponent),
  },
  {
    path: 'leg/com/rda/sec/aut-tasa',
    loadComponent: () => import('./components/autonomia-tasas/autonomia-tasas.component').then((m) => m.AutonomiaTasasComponent),
  },
  {
    path: 'leg/com/rda/sec/cam-agl',
    loadComponent: () => import('./components/campana-agil/campana-agil.component').then((m) => m.CampanaAgilComponent),
  },
  {
    path: 'leg/com/rda/sec/canal_alt',
    loadComponent: () => import('./components/canal-alterno/canal-alterno.component').then((m) => m.CanalAlternoComponent),
  },
  {
    path: 'leg/com/rda/sec/cli_pot',
    loadComponent: () => import('./components/clientes-potenciales/clientes-potenciales.component').then((m) => m.ClientesPotencialesComponent),
  },
  {
    path: 'leg/com/rda/sec/aut',
    loadComponent: () => import('./components/autonomias/autonomias.component').then((m) => m.AutonomiasComponent),
  },
  {
    path: 'leg/com/rda/sec/proy_M6',
    loadComponent: () => import('./components/colocaciones-diaria/colocaciones-diaria.component').then((m) => m.ColocacionesDiariaComponent),
  },
  {
    path: 'leg/com/rda/sec/res-mov-sec',
    loadComponent: () => import('./components/resumen-movilidad/resumen-movilidad.component').then((m) => m.ResumenMovilidadComponent),
  },
  {
    path: 'leg/com/rda/sec/desempeno-social-as',
    loadComponent: () =>
      import('./components/desempeno-social-analista/desempeno-social-analista.component').then((m) => m.DesempenoSocialAnalistaComponent),
  },
  {
    path: 'leg/com/rda/sec/mon_efec_sec',
    loadComponent: () =>
      import('./components/monitor-efectividades/monitor-efectividades.component').then((m) => m.MonitorEfectividadesComponent),
  },
  {
    path: 'leg/com/rda/sec/plan-datos-sec',
    loadComponent: () => import('./components/plan-datos/plan-datos.component').then((m) => m.PlanDatosComponent),
  },
  {
    path: 'leg/com/rda/sec/plan-mov-sec',
    loadComponent: () => import('./components/planilla-movilidad/planilla-movilidad.component').then((m) => m.PlanillaMovilidadComponent),
  },
  {
    path: 'leg/com/rda/sec/inv-stk',
    loadComponent: () =>
      import('./components/inversion-stock-mora/inversion-stock-mora.component').then((m) => m.InversionStockMoraComponent),
  },
];
