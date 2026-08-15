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
    loadComponent: () => import('./encuesta-clientes/encuesta-clientes.component').then((m) => m.EncuestaClientesComponent),
  },
  {
    path: 'leg/com/rda/sec/repro',
    loadComponent: () =>
      import('./clientes-reprogramados/clientes-reprogramados.component').then((m) => m.ClientesReprogramadosComponent),
  },
  {
    path: 'leg/com/rda/sec/cli-act',
    loadComponent: () => import('./datos-clientes/datos-clientes.component').then((m) => m.DatosClientesComponent),
  },
  {
    path: 'leg/com/rda/sec/cartera',
    loadComponent: () => import('./cartera/cartera.component').then((m) => m.CarteraComponent),
  },
  {
    path: 'leg/com/rda/sec/cli-prod',
    loadComponent: () => import('./clientes-producto/clientes-producto.component').then((m) => m.ClientesProductoComponent),
  },
  {
    path: 'leg/com/rda/sec/cli-nue-rec',
    loadComponent: () =>
      import('./clientes-nuevos-recurrentes/clientes-nuevos-recurrentes.component').then(
        (m) => m.ClientesNuevosRecurrentesComponent,
      ),
  },
  {
    path: 'leg/com/rda/sec/capta',
    loadComponent: () => import('./captaciones/captaciones.component').then((m) => m.CaptacionesComponent),
  },
  {
    path: 'leg/com/rda/sec/sec-prosp',
    loadComponent: () =>
      import('./prospecto-corresponsal/prospecto-corresponsal.component').then((m) => m.ProspectoCorresponsalComponent),
  },
  {
    path: 'leg/com/rda/sec/seg',
    loadComponent: () => import('./seguros/seguros.component').then((m) => m.SegurosComponent),
  },
  {
    path: 'leg/com/rda/sec/mon-desem',
    loadComponent: () =>
      import('./monitor-metas-desembolso/monitor-metas-desembolso.component').then((m) => m.MonitorMetasDesembolsoAnalistaComponent),
  },
  {
    path: 'leg/com/rda/sec/rec-prev',
    loadComponent: () =>
      import('./recuperacion-preventiva/recuperacion-preventiva.component').then((m) => m.RecuperacionPreventivaComponent),
  },
  {
    path: 'leg/com/rda/sec/zu-cuo',
    loadComponent: () => import('./cero-cuotas/cero-cuotas.component').then((m) => m.CeroCuotasComponent),
  },
  {
    path: 'leg/com/rda/sec/pdm',
    loadComponent: () => import('./grupos-por-vencer/grupos-por-vencer.component').then((m) => m.GruposPorVencerComponent),
  },
  {
    path: 'leg/com/rda/sec/aut-tasa',
    loadComponent: () => import('./autonomia-tasas/autonomia-tasas.component').then((m) => m.AutonomiaTasasComponent),
  },
  {
    path: 'leg/com/rda/sec/cam-agl',
    loadComponent: () => import('./campana-agil/campana-agil.component').then((m) => m.CampanaAgilComponent),
  },
  {
    path: 'leg/com/rda/sec/canal_alt',
    loadComponent: () => import('./canal-alterno/canal-alterno.component').then((m) => m.CanalAlternoComponent),
  },
  {
    path: 'leg/com/rda/sec/cli_pot',
    loadComponent: () => import('./clientes-potenciales/clientes-potenciales.component').then((m) => m.ClientesPotencialesComponent),
  },
  {
    path: 'leg/com/rda/sec/aut',
    loadComponent: () => import('./autonomias/autonomias.component').then((m) => m.AutonomiasComponent),
  },
  {
    path: 'leg/com/rda/sec/proy_M6',
    loadComponent: () => import('./colocaciones-diaria/colocaciones-diaria.component').then((m) => m.ColocacionesDiariaComponent),
  },
  {
    path: 'leg/com/rda/sec/res-mov-sec',
    loadComponent: () => import('./resumen-movilidad/resumen-movilidad.component').then((m) => m.ResumenMovilidadComponent),
  },
  {
    path: 'leg/com/rda/sec/desempeno-social-as',
    loadComponent: () =>
      import('./desempeno-social-analista/desempeno-social-analista.component').then((m) => m.DesempenoSocialAnalistaComponent),
  },
  {
    path: 'leg/com/rda/sec/mon_efec_sec',
    loadComponent: () =>
      import('./monitor-efectividades/monitor-efectividades.component').then((m) => m.MonitorEfectividadesComponent),
  },
  {
    path: 'leg/com/rda/sec/plan-datos-sec',
    loadComponent: () => import('./plan-datos/plan-datos.component').then((m) => m.PlanDatosComponent),
  },
  {
    path: 'leg/com/rda/sec/plan-mov-sec',
    loadComponent: () => import('./planilla-movilidad/planilla-movilidad.component').then((m) => m.PlanillaMovilidadComponent),
  },
  {
    path: 'leg/com/rda/sec/inv-stk',
    loadComponent: () =>
      import('./inversion-stock-mora/inversion-stock-mora.component').then((m) => m.InversionStockMoraComponent),
  },
];
