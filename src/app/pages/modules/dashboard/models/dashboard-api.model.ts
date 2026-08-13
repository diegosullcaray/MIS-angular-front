import type { ReporteDashboard } from './reporte.model';

/** Forma cruda de `reportes2.lista` (`resultado`). */
export interface ListaReportesBody {
  resultado?: {
    list?: ReporteDashboard[];
    /** 1 = el usuario administra el módulo (controla el botón "Usuarios"), igual que `mod_admin` del legado. */
    mod_admin?: number;
  };
}

/** Forma cruda de `reportes2.pbi_rtoken` (`resultado`). */
export interface TokenReporteBody {
  resultado?: { token?: string };
}

/** Forma cruda de `reportes2.usuarios` (`resultado`) — igual convención que `esg.get_users`. */
export interface UsuariosReporteBody {
  resultado?: {
    code?: string;
    row?: { use_lis?: string };
  };
}
