/**
 * Modelos del módulo "Dashboards Integrados" (`/app/dashboards`) — migrado
 * del legado STG (`pages/modules/reportes-e`, backend Ant módulo `reportes2`,
 * mismo port/appId/secret que Presupuesto/ESG — ver `ModDashboardService`).
 */

/** Reporte integrado — fila de `reportes2.lista`. Solo `reportType==='PowerBIReport'` es embebible hoy (ver `PrincipalComponent.abrirReporte()`). */
export interface ReporteDashboard {
  id: string;
  name: string;
  reportType: string;
  datasetId?: string;
  [key: string]: unknown;
}

/** Ítem con el pseudo-reporte "Todos" anteponible a la lista real (usado por el diálogo de Usuarios). */
export interface ReporteListItem {
  id: string;
  name: string;
}

/** Ítem de `reportes2.guardar` — usuarios con acceso a un reporte puntual. */
export interface UsuariosPorReporte {
  id: string;
  val: string;
}
